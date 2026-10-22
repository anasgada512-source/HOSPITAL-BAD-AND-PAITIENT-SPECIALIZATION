import 'dotenv/config';
import { fileURLToPath } from 'url';
import { Department, Doctor, Bed, Patient, nextId } from '../models/index.js';

// All names below are fictional sample data for demonstration only.
const DEPARTMENTS = [
  { slug: 'cardiology', prefix: 'CAR', name: 'Cardiology', icon: '🫀', floor: 2,
    description: 'Heart and blood-vessel care, from chest pain assessment to cardiac monitoring.',
    treats: ['Chest pain', 'Heart attack', 'Hypertension', 'Arrhythmia'] },
  { slug: 'neurology', prefix: 'NEU', name: 'Neurology', icon: '🧠', floor: 3,
    description: 'Brain, spine and nerve conditions, including stroke and seizure care.',
    treats: ['Stroke', 'Epilepsy', 'Migraine', 'Nerve disorders'] },
  { slug: 'orthopedics', prefix: 'ORT', name: 'Orthopedics', icon: '🦴', floor: 1,
    description: 'Bones, joints and muscles: fractures, joint replacement and sports injuries.',
    treats: ['Fractures', 'Joint pain', 'Spine problems', 'Sports injuries'] },
  { slug: 'pediatrics', prefix: 'PED', name: 'Pediatrics', icon: '🧒', floor: 1,
    description: 'Medical care for infants, children and teenagers.',
    treats: ['Fever and infections', 'Asthma', 'Growth concerns', 'Vaccination'] },
  { slug: 'obstetrics-and-gynecology', prefix: 'OBG', name: 'Obstetrics and Gynecology', icon: '🤰', floor: 4,
    description: 'Pregnancy, delivery and women\'s health.',
    treats: ['Pregnancy care', 'Delivery', 'Menstrual disorders', 'Post-natal care'] },
  { slug: 'general-medicine', prefix: 'GEN', name: 'General Medicine', icon: '🩺', floor: 1,
    description: 'First point of care for adults: infections, diabetes, fevers and everyday illness.',
    treats: ['Fever', 'Diabetes', 'Infections', 'General check-up'] },
  { slug: 'emergency-and-trauma', prefix: 'EMR', name: 'Emergency and Trauma', icon: '🚑', floor: 0,
    description: 'Round-the-clock care for accidents, injuries and sudden serious illness.',
    treats: ['Accidents', 'Burns', 'Poisoning', 'Severe bleeding'] },
  { slug: 'oncology', prefix: 'ONC', name: 'Oncology', icon: '🎗️', floor: 5,
    description: 'Diagnosis and treatment of cancer, including chemotherapy day care.',
    treats: ['Cancer screening', 'Chemotherapy', 'Radiation follow-up', 'Palliative care'] },
];

const BED_PLAN = [
  { type: 'ICU', rate: 8000 }, { type: 'ICU', rate: 8000 },
  { type: 'General', rate: 1500 }, { type: 'General', rate: 1500 },
  { type: 'General', rate: 1500 }, { type: 'General', rate: 1500 },
  { type: 'Private', rate: 4500 }, { type: 'Private', rate: 4500 },
];

const DOCTORS = {
  cardiology: [['Dr. Rohan Mehta', 'MD, DM Cardiology', 14, ['Mon', 'Wed', 'Fri']], ['Dr. Kavita Rao', 'MD, DNB Cardiology', 9, ['Tue', 'Thu', 'Sat']]],
  neurology: [['Dr. Imran Qureshi', 'MD, DM Neurology', 12, ['Mon', 'Tue', 'Thu']], ['Dr. Sneha Iyer', 'MD, DM Neurology', 8, ['Wed', 'Fri', 'Sat']]],
  orthopedics: [['Dr. Arjun Malhotra', 'MS Orthopedics', 16, ['Mon', 'Wed', 'Fri']], ['Dr. Farah Siddiqui', 'MS, DNB Orthopedics', 7, ['Tue', 'Thu', 'Sat']]],
  pediatrics: [['Dr. Neha Verma', 'MD Pediatrics', 10, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']], ['Dr. Sameer Khan', 'MD, DCH', 6, ['Wed', 'Fri', 'Sat']]],
  'obstetrics-and-gynecology': [['Dr. Priya Nair', 'MD, DGO', 13, ['Mon', 'Wed', 'Sat']], ['Dr. Ayesha Ansari', 'MS Obstetrics and Gynecology', 11, ['Tue', 'Thu', 'Fri']]],
  'general-medicine': [['Dr. Vikram Singh', 'MD Medicine', 15, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']], ['Dr. Pooja Bansal', 'MD Medicine', 5, ['Mon', 'Wed', 'Fri']]],
  'emergency-and-trauma': [['Dr. Kabir Ahmed', 'MD Emergency Medicine', 9, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']], ['Dr. Anjali Deshmukh', 'MS, MCh Trauma Surgery', 12, ['Mon', 'Wed', 'Fri', 'Sun']]],
  oncology: [['Dr. Rakesh Pillai', 'MD, DM Medical Oncology', 18, ['Tue', 'Thu']], ['Dr. Sana Hashmi', 'MD Radiation Oncology', 8, ['Mon', 'Wed', 'Fri']]],
};

// [name, age, gender, phone, condition, department slug, priority, state]
const PATIENTS = [
  ['Ramesh Kumar', 58, 'Male', '9810000001', 'Chest pain with sweating since morning', 'cardiology', 'critical', 'admitted'],
  ['Sunita Devi', 49, 'Female', '9810000002', 'High blood pressure, needs monitoring', 'cardiology', 'urgent', 'admitted'],
  ['Mohammad Shahid', 66, 'Male', '9810000003', 'Sudden weakness on the left side', 'neurology', 'critical', 'admitted'],
  ['Aarav Sharma', 7, 'Male', '9810000004', 'High fever and breathing difficulty', 'pediatrics', 'urgent', 'admitted'],
  ['Kiran Patel', 34, 'Female', '9810000005', 'Labour pains, second delivery', 'obstetrics-and-gynecology', 'urgent', 'admitted'],
  ['Deepak Yadav', 27, 'Male', '9810000006', 'Fracture of right leg after road accident', 'orthopedics', 'urgent', 'admitted'],
  ['Zainab Fatima', 41, 'Female', '9810000007', 'Severe recurring migraine', 'neurology', 'routine', 'waiting'],
  ['Harish Chandra', 72, 'Male', '9810000008', 'Irregular heartbeat and dizziness', 'cardiology', 'urgent', 'waiting'],
  ['Meena Joshi', 55, 'Female', '9810000009', 'Chemotherapy cycle 3, day-care admission', 'oncology', 'routine', 'waiting'],
  ['Baby of Ritu', 1, 'Female', '', 'Persistent fever for 3 days', 'pediatrics', 'urgent', 'waiting'],
  ['Salman Raza', 30, 'Male', '9810000012', 'Deep burns on forearm', 'emergency-and-trauma', 'critical', 'waiting'],
  ['Geeta Rani', 63, 'Female', '9810000013', 'Knee replacement planned', 'orthopedics', 'routine', 'discharged'],
];

const ORDER = { critical: ['ICU', 'Emergency', 'Private', 'General'], urgent: ['Private', 'General', 'Emergency'], routine: ['General', 'Private'] };

export async function seedAll() {
  await Promise.all([Department.deleteMany({}), Doctor.deleteMany({}), Bed.deleteMany({}), Patient.deleteMany({})]);

  const depts = {};
  for (const d of DEPARTMENTS) {
    depts[d.slug] = await Department.create({ slug: d.slug, name: d.name, icon: d.icon, floor: d.floor, description: d.description, treats: d.treats });
  }

  for (const d of DEPARTMENTS) {
    await Bed.insertMany(
      BED_PLAN.map((b, i) => ({
        code: d.prefix + '-' + (101 + i),
        department: depts[d.slug]._id,
        ward: b.type === 'ICU' ? d.name + ' ICU' : d.name + ' Ward',
        floor: d.floor,
        type: b.type,
        dailyRate: b.rate,
      }))
    );
    await Doctor.insertMany(
      DOCTORS[d.slug].map(([name, qualification, experienceYears, availableDays]) => ({
        name, qualification, experienceYears, availableDays, department: depts[d.slug]._id, onDuty: true,
      }))
    );
  }

  for (const [name, age, gender, phone, condition, slug, priority, state] of PATIENTS) {
    const dept = depts[slug];
    const patient = await Patient.create({
      patientId: await nextId('patient', 'PAT'),
      name, age, gender, phone, condition, priority, department: dept._id, registeredBy: 'seed',
    });
    if (state === 'waiting') continue;

    let bed = null;
    for (const type of ORDER[priority]) {
      bed = await Bed.findOneAndUpdate(
        { department: dept._id, type, status: 'available' },
        { status: state === 'admitted' ? 'occupied' : 'cleaning', patient: state === 'admitted' ? patient._id : null },
        { new: true, sort: { code: 1 } }
      );
      if (bed) break;
    }
    const doctor = await Doctor.findOne({ department: dept._id, onDuty: true });
    patient.status = state;
    patient.bedCode = bed ? bed.code : '';
    patient.doctor = doctor ? doctor._id : null;
    patient.admittedAt = new Date(Date.now() - 36 * 3600 * 1000);
    if (state === 'admitted') patient.bed = bed ? bed._id : null;
    if (state === 'discharged') patient.dischargedAt = new Date();
    await patient.save();
  }

  // a couple of beds under maintenance so every status is visible
  // (only beds that are still free, so no patient is ever moved off their bed)
  await Bed.updateOne({ code: 'GEN-106', status: 'available' }, { status: 'maintenance' });
  await Bed.updateOne({ code: 'ORT-104', status: 'available' }, { status: 'maintenance' });

  console.log('Seeded ' + DEPARTMENTS.length + ' specializations, ' + DEPARTMENTS.length * BED_PLAN.length + ' beds, ' + DEPARTMENTS.length * 2 + ' doctors and ' + PATIENTS.length + ' sample patients');
}

// Runs on server start: only fills an empty database, never touches existing hospital data.
export async function seedIfEmpty() {
  if ((await Department.estimatedDocumentCount()) === 0) await seedAll();
}

// `npm run seed -- --force` wipes departments, beds, doctors and patients and loads the sample data again.
// Without --force it only fills an empty database. User accounts are never touched.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { connectDB } = await import('../config/db.js');
  const mongoose = (await import('mongoose')).default;
  await connectDB();
  if (process.argv.includes('--force')) await seedAll();
  else if ((await Department.estimatedDocumentCount()) === 0) await seedAll();
  else console.log('Database already has data. Use "npm run seed -- --force" to reset it to the sample data.');
  await mongoose.disconnect();
}
