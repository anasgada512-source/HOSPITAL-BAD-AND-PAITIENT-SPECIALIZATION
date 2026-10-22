import { Router } from 'express';
import { Patient, Bed, Doctor, Department, PRIORITY, nextId } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, isId, str, PHONE_RE, HttpError, withLock } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

// Which bed types to try first, by priority. Routine patients never take ICU or emergency beds.
const BED_ORDER = {
  critical: ['ICU', 'Emergency', 'Private', 'General'],
  urgent: ['Private', 'General', 'Emergency'],
  routine: ['General', 'Private'],
};
const RANK = { critical: 0, urgent: 1, routine: 2 };
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const populate = (q) =>
  q
    .populate('department', 'name slug icon')
    .populate('bed', 'code type ward floor')
    .populate('doctor', 'name qualification');

async function pickDoctor(departmentId) {
  const doctors = await Doctor.find({ department: departmentId, onDuty: true }).lean();
  if (!doctors.length) return null;
  const loads = await Promise.all(
    doctors.map((d) => Patient.countDocuments({ doctor: d._id, status: 'admitted' }))
  );
  let best = 0;
  loads.forEach((n, i) => { if (n < loads[best]) best = i; });
  return doctors[best];
}

// List patients (filters: status, department slug, q)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (['waiting', 'admitted', 'discharged'].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.department) {
      const d = await Department.findOne({ slug: str(req.query.department, 60) }).select('_id');
      if (!d) return res.json([]);
      filter.department = d._id;
    }
    const q = str(req.query.q, 60);
    if (q) {
      const re = new RegExp(escapeRe(q), 'i');
      filter.$or = [{ name: re }, { patientId: re }, { phone: re }];
    }
    const list = await populate(Patient.find(filter).sort('-createdAt').limit(300)).lean();
    list.sort((a, b) => {
      // waiting first, most urgent first, then newest
      const s = (x) => (x.status === 'waiting' ? 0 : x.status === 'admitted' ? 1 : 2);
      return s(a) - s(b) || RANK[a.priority] - RANK[b.priority] || new Date(b.createdAt) - new Date(a.createdAt);
    });
    res.json(list);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = str(req.body.name, 80);
    const age = Number(req.body.age);
    const phone = str(req.body.phone, 20);
    const condition = str(req.body.condition, 300);

    if (name.length < 2) return res.status(400).json({ message: 'Patient name is required.' });
    if (!Number.isFinite(age) || age < 0 || age > 120) return res.status(400).json({ message: 'Enter a valid age (0 to 120).' });
    if (!['Male', 'Female', 'Other'].includes(req.body.gender)) return res.status(400).json({ message: 'Choose a gender.' });
    if (phone && !PHONE_RE.test(phone)) return res.status(400).json({ message: 'Enter a valid phone number or leave it empty.' });
    if (condition.length < 3) return res.status(400).json({ message: 'Describe the condition or complaint.' });
    if (!isId(req.body.department) || !(await Department.exists({ _id: req.body.department })))
      return res.status(400).json({ message: 'Choose the required specialization.' });

    const patient = await Patient.create({
      patientId: await nextId('patient', 'PAT'),
      name,
      age: Math.round(age),
      gender: req.body.gender,
      phone,
      condition,
      department: req.body.department,
      priority: PRIORITY.includes(req.body.priority) ? req.body.priority : 'routine',
      notes: str(req.body.notes, 1000),
      registeredBy: req.user.userId,
    });
    res.status(201).json(await populate(Patient.findById(patient._id)).lean());
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Patient not found.' });
    const p = await populate(Patient.findById(req.params.id)).lean();
    if (!p) return res.status(404).json({ message: 'Patient not found.' });
    res.json(p);
  })
);

// Suggested beds and doctors for a waiting patient (same specialization, best bed type first)
router.get(
  '/:id/suggest',
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Patient not found.' });
    const p = await Patient.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ message: 'Patient not found.' });
    const order = BED_ORDER[p.priority];
    const beds = await Bed.find({ department: p.department, status: 'available' }).sort('code').lean();
    const usable = beds
      .filter((b) => order.includes(b.type))
      .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    const doctors = await Doctor.find({ department: p.department, onDuty: true }).select('name qualification').lean();
    res.json({ beds: usable, doctors, preferredTypes: order });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const p = await Patient.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Patient not found.' });
    if (p.status === 'discharged') return res.status(409).json({ message: 'Discharged records cannot be edited.' });
    if (req.body.condition !== undefined) {
      const c = str(req.body.condition, 300);
      if (c.length < 3) return res.status(400).json({ message: 'Describe the condition or complaint.' });
      p.condition = c;
    }
    if (PRIORITY.includes(req.body.priority)) p.priority = req.body.priority;
    if (req.body.notes !== undefined) p.notes = str(req.body.notes, 1000);
    if (req.body.phone !== undefined) {
      const ph = str(req.body.phone, 20);
      if (ph && !PHONE_RE.test(ph)) return res.status(400).json({ message: 'Enter a valid phone number.' });
      p.phone = ph;
    }
    await p.save();
    res.json(await populate(Patient.findById(p._id)).lean());
  })
);

/* ---------- Admit: claim a bed atomically so two people can never get the same bed ---------- */
router.post(
  '/:id/admit',
  asyncHandler((req, res) => withLock('beds', () => admit(req, res)))
);

async function admit(req, res) {
    if (!isId(req.params.id)) throw new HttpError(404, 'Patient not found.');
    const patient = await Patient.findById(req.params.id);
    if (!patient) throw new HttpError(404, 'Patient not found.');
    if (patient.status !== 'waiting') throw new HttpError(409, 'Only waiting patients can be admitted.');

    const isAdmin = req.user.role === 'admin';
    let bed = null;

    if (req.body.bedId) {
      if (!isId(req.body.bedId)) throw new HttpError(400, 'Invalid bed.');
      const wanted = await Bed.findById(req.body.bedId).select('department');
      if (!wanted) throw new HttpError(404, 'Bed not found.');
      if (String(wanted.department) !== String(patient.department) && !isAdmin)
        throw new HttpError(400, 'This bed belongs to a different specialization. Choose a bed from the patient\'s department.');
      bed = await Bed.findOneAndUpdate(
        { _id: wanted._id, status: 'available' },
        { status: 'occupied', patient: patient._id },
        { new: true }
      );
      if (!bed) throw new HttpError(409, 'That bed is no longer available. Pick another one.');
    } else {
      for (const type of BED_ORDER[patient.priority]) {
        bed = await Bed.findOneAndUpdate(
          { department: patient.department, type, status: 'available' },
          { status: 'occupied', patient: patient._id },
          { new: true, sort: { code: 1 } }
        );
        if (bed) break;
      }
      if (!bed) {
        const dept = await Department.findById(patient.department).select('name');
        throw new HttpError(409, 'No suitable bed is free in ' + (dept ? dept.name : 'this department') + ' right now. The patient stays in the waiting queue.');
      }
    }

    try {
      let doctor = null;
      if (req.body.doctorId && isId(req.body.doctorId)) {
        doctor = await Doctor.findById(req.body.doctorId);
        if (doctor && String(doctor.department) !== String(patient.department) && !isAdmin) doctor = null;
      }
      if (!doctor) doctor = await pickDoctor(patient.department);

      patient.status = 'admitted';
      patient.bed = bed._id;
      patient.bedCode = bed.code;
      patient.doctor = doctor ? doctor._id : null;
      patient.admittedAt = new Date();
      await patient.save();
    } catch (err) {
      await Bed.updateOne({ _id: bed._id }, { status: 'available', patient: null }); // give the bed back
      throw err;
    }
    res.json(await populate(Patient.findById(patient._id)).lean());
}

/* ---------- Discharge: bed goes to "cleaning" until staff mark it ready ---------- */
router.post(
  '/:id/discharge',
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, 'Patient not found.');
    const patient = await Patient.findById(req.params.id);
    if (!patient) throw new HttpError(404, 'Patient not found.');
    if (patient.status !== 'admitted') throw new HttpError(409, 'Only admitted patients can be discharged.');

    if (patient.bed) await Bed.updateOne({ _id: patient.bed }, { status: 'cleaning', patient: null });
    patient.status = 'discharged';
    patient.dischargedAt = new Date();
    patient.bed = null; // bedCode is kept for the record
    await patient.save();
    res.json(await populate(Patient.findById(patient._id)).lean());
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const p = await Patient.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Patient not found.' });
    if (p.status === 'admitted') return res.status(409).json({ message: 'Discharge the patient before deleting the record.' });
    await p.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
