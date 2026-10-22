import { Router } from 'express';
import { Department, Doctor, Bed, Patient } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, slugify, str } from '../utils/helpers.js';

const router = Router();

function countBeds(beds) {
  const c = { total: beds.length, available: 0, occupied: 0, cleaning: 0, maintenance: 0 };
  for (const b of beds) c[b.status]++;
  return c;
}

// Public: every specialization with live bed availability and doctors on duty
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [departments, beds, doctors] = await Promise.all([
      Department.find().sort('name').lean(),
      Bed.find().select('department status').lean(),
      Doctor.find().select('department onDuty').lean(),
    ]);
    res.json(
      departments.map((d) => {
        const id = String(d._id);
        return {
          ...d,
          beds: countBeds(beds.filter((b) => String(b.department) === id)),
          doctors: doctors.filter((x) => String(x.department) === id).length,
          doctorsOnDuty: doctors.filter((x) => String(x.department) === id && x.onDuty).length,
        };
      })
    );
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const dept = await Department.findOne({ slug: req.params.slug }).lean();
    if (!dept) return res.status(404).json({ message: 'Specialization not found.' });
    const [beds, doctors] = await Promise.all([
      Bed.find({ department: dept._id }).select('type status').lean(),
      Doctor.find({ department: dept._id }).sort('name').lean(),
    ]);
    const byType = {};
    for (const b of beds) {
      byType[b.type] = byType[b.type] || { total: 0, available: 0 };
      byType[b.type].total++;
      if (b.status === 'available') byType[b.type].available++;
    }
    res.json({ ...dept, beds: countBeds(beds), bedsByType: byType, doctors });
  })
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = str(req.body.name, 80);
    if (name.length < 3) return res.status(400).json({ message: 'Specialization name is required.' });
    const slug = slugify(name);
    if (await Department.exists({ slug })) return res.status(409).json({ message: 'That specialization already exists.' });
    const treats = String(req.body.treats || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12);
    const dept = await Department.create({
      slug,
      name,
      icon: str(req.body.icon, 4) || '🏥',
      floor: Math.max(0, Math.min(50, Number(req.body.floor) || 1)),
      description: str(req.body.description, 400),
      treats,
    });
    res.status(201).json(dept);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (await Bed.exists({ department: id }) || (await Doctor.exists({ department: id })) || (await Patient.exists({ department: id, status: { $ne: 'discharged' } })))
      return res.status(409).json({ message: 'Remove its beds, doctors and active patients first.' });
    await Department.findByIdAndDelete(id);
    res.json({ ok: true });
  })
);

export default router;
