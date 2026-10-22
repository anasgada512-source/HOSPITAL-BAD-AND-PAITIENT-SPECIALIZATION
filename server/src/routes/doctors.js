import { Router } from 'express';
import { Doctor, Department, Patient } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, isId, str } from '../utils/helpers.js';

const router = Router();
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Public: doctors, optionally filtered by specialization slug
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.department) {
      const d = await Department.findOne({ slug: str(req.query.department, 60) }).select('_id');
      if (!d) return res.json([]);
      filter.department = d._id;
    }
    const doctors = await Doctor.find(filter).populate('department', 'name slug icon').sort('name').lean();
    res.json(doctors);
  })
);

function readBody(b) {
  const days = (Array.isArray(b.availableDays) ? b.availableDays : String(b.availableDays || '').split(','))
    .map((d) => String(d).trim().slice(0, 3))
    .filter((d) => DAYS.includes(d));
  return {
    name: str(b.name, 80),
    qualification: str(b.qualification, 120),
    experienceYears: Math.max(0, Math.min(60, Number(b.experienceYears) || 0)),
    availableDays: days,
    onDuty: b.onDuty !== false,
  };
}

router.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = readBody(req.body);
    if (data.name.length < 3) return res.status(400).json({ message: 'Doctor name is required.' });
    if (!isId(req.body.department) || !(await Department.exists({ _id: req.body.department })))
      return res.status(400).json({ message: 'Choose a valid specialization.' });
    const doc = await Doctor.create({ ...data, department: req.body.department });
    res.status(201).json(doc);
  })
);

router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = readBody(req.body);
    if (data.name.length < 3) return res.status(400).json({ message: 'Doctor name is required.' });
    if (isId(req.body.department) && (await Department.exists({ _id: req.body.department })))
      data.department = req.body.department;
    const doc = await Doctor.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!doc) return res.status(404).json({ message: 'Doctor not found.' });
    res.json(doc);
  })
);

// Any logged in staff member can mark a doctor on / off duty
router.patch(
  '/:id/duty',
  requireAuth,
  asyncHandler(async (req, res) => {
    const doc = await Doctor.findByIdAndUpdate(req.params.id, { onDuty: req.body.onDuty === true }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Doctor not found.' });
    res.json(doc);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (await Patient.exists({ doctor: req.params.id, status: 'admitted' }))
      return res.status(409).json({ message: 'This doctor has admitted patients. Discharge them first.' });
    const doc = await Doctor.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doctor not found.' });
    res.json({ ok: true });
  })
);

export default router;
