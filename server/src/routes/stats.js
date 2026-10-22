import { Router } from 'express';
import { Bed, Department, Doctor, Patient } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

// Public: headline numbers for the home page
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [beds, departments, doctors, onDuty] = await Promise.all([
      Bed.find().select('status').lean(),
      Department.countDocuments(),
      Doctor.countDocuments(),
      Doctor.countDocuments({ onDuty: true }),
    ]);
    res.json({
      beds: beds.length,
      available: beds.filter((b) => b.status === 'available').length,
      departments,
      doctors,
      doctorsOnDuty: onDuty,
    });
  })
);

// Staff: dashboard numbers and the waiting queue
router.get(
  '/overview',
  requireAuth,
  asyncHandler(async (req, res) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [beds, departments, waiting, admitted, dischargedToday] = await Promise.all([
      Bed.find().select('department status type').lean(),
      Department.find().sort('name').lean(),
      Patient.find({ status: 'waiting' }).populate('department', 'name slug icon').sort('createdAt').lean(),
      Patient.countDocuments({ status: 'admitted' }),
      Patient.countDocuments({ status: 'discharged', dischargedAt: { $gte: startOfDay } }),
    ]);

    const rank = { critical: 0, urgent: 1, routine: 2 };
    waiting.sort((a, b) => rank[a.priority] - rank[b.priority] || new Date(a.createdAt) - new Date(b.createdAt));

    const byDepartment = departments.map((d) => {
      const mine = beds.filter((b) => String(b.department) === String(d._id));
      const occupied = mine.filter((b) => b.status === 'occupied').length;
      return {
        slug: d.slug,
        name: d.name,
        icon: d.icon,
        total: mine.length,
        available: mine.filter((b) => b.status === 'available').length,
        occupied,
        cleaning: mine.filter((b) => b.status === 'cleaning').length,
        maintenance: mine.filter((b) => b.status === 'maintenance').length,
        waiting: waiting.filter((p) => String(p.department?._id) === String(d._id)).length,
        occupancy: mine.length ? Math.round((occupied / mine.length) * 100) : 0,
      };
    });

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
    res.json({
      totalBeds,
      occupiedBeds,
      availableBeds: beds.filter((b) => b.status === 'available').length,
      occupancy: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      admitted,
      waitingCount: waiting.length,
      dischargedToday,
      byDepartment,
      queue: waiting.slice(0, 12),
    });
  })
);

export default router;
