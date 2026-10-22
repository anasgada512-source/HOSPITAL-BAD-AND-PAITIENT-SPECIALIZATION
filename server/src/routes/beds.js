import { Router } from 'express';
import { Bed, Department, BED_TYPES } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, isId, str } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth); // the full bed board (with patient names) is for staff only

const RATES = { General: 1500, Private: 4500, ICU: 8000, Emergency: 3000 };

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.department) {
      const d = await Department.findOne({ slug: str(req.query.department, 60) }).select('_id');
      if (!d) return res.json([]);
      filter.department = d._id;
    }
    if (['available', 'occupied', 'cleaning', 'maintenance'].includes(req.query.status)) filter.status = req.query.status;
    if (BED_TYPES.includes(req.query.type)) filter.type = req.query.type;

    const beds = await Bed.find(filter)
      .populate('department', 'name slug icon')
      .populate('patient', 'name patientId priority age gender condition')
      .sort('code')
      .lean();
    res.json(beds);
  })
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const code = str(req.body.code, 20).toUpperCase();
    const type = BED_TYPES.includes(req.body.type) ? req.body.type : 'General';
    if (!/^[A-Z0-9-]{3,20}$/.test(code)) return res.status(400).json({ message: 'Bed code: 3 to 20 letters, numbers or dashes (e.g. CAR-110).' });
    if (!isId(req.body.department) || !(await Department.exists({ _id: req.body.department })))
      return res.status(400).json({ message: 'Choose a valid specialization.' });
    if (await Bed.exists({ code })) return res.status(409).json({ message: 'A bed with this code already exists.' });

    const bed = await Bed.create({
      code,
      department: req.body.department,
      ward: str(req.body.ward, 60),
      floor: Math.max(0, Math.min(50, Number(req.body.floor) || 1)),
      type,
      dailyRate: Math.max(0, Number(req.body.dailyRate) || RATES[type]),
    });
    res.status(201).json(bed);
  })
);

// Staff: change status between available / cleaning / maintenance (never manually to occupied)
// Admin: can also edit ward, floor, type and rate
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).json({ message: 'Bed not found.' });

    if (req.body.status !== undefined) {
      if (!['available', 'cleaning', 'maintenance'].includes(req.body.status))
        return res.status(400).json({ message: 'Status can be set to available, cleaning or maintenance. Admit a patient to occupy a bed.' });
      if (bed.status === 'occupied')
        return res.status(409).json({ message: 'This bed is occupied. Discharge the patient first.' });
      bed.status = req.body.status;
    }
    if (req.user.role === 'admin') {
      if (req.body.ward !== undefined) bed.ward = str(req.body.ward, 60);
      if (req.body.floor !== undefined) bed.floor = Math.max(0, Math.min(50, Number(req.body.floor) || 0));
      if (req.body.dailyRate !== undefined) bed.dailyRate = Math.max(0, Number(req.body.dailyRate) || 0);
      if (BED_TYPES.includes(req.body.type)) bed.type = req.body.type;
    }
    await bed.save();
    res.json(bed);
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).json({ message: 'Bed not found.' });
    if (bed.status === 'occupied') return res.status(409).json({ message: 'This bed is occupied. Discharge the patient first.' });
    await bed.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
