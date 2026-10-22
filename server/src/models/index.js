import mongoose from 'mongoose';

const { Schema } = mongoose;

/* ---------- Counter: sequential human friendly ids (HMS-00001, PAT-00001) ---------- */
const Counter = mongoose.model(
  'Counter',
  new Schema({ _id: String, seq: { type: Number, default: 0 } })
);

export async function nextId(name, prefix, pad = 5) {
  const c = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return prefix + '-' + String(c.seq).padStart(pad, '0');
}

/* ---------- User (hospital staff) ---------- */
const userSchema = new Schema(
  {
    userId: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['staff', 'admin'], default: 'staff' },
  },
  { timestamps: true }
);
userSchema.methods.toPublic = function () {
  return { id: this._id, userId: this.userId, name: this.name, email: this.email, role: this.role, createdAt: this.createdAt };
};
export const User = mongoose.model('User', userSchema);

/* ---------- Department = specialization ---------- */
export const Department = mongoose.model(
  'Department',
  new Schema({
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: '🏥' },
    floor: { type: Number, default: 1 },
    description: { type: String, default: '' },
    treats: [String],
  })
);

/* ---------- Doctor ---------- */
export const Doctor = mongoose.model(
  'Doctor',
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
      qualification: { type: String, default: '' },
      experienceYears: { type: Number, default: 0 },
      availableDays: [String],
      onDuty: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

/* ---------- Bed ---------- */
export const BED_TYPES = ['General', 'Private', 'ICU', 'Emergency'];
export const BED_STATUS = ['available', 'occupied', 'cleaning', 'maintenance'];

export const Bed = mongoose.model(
  'Bed',
  new Schema(
    {
      code: { type: String, required: true, unique: true, trim: true, uppercase: true },
      department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
      ward: { type: String, default: '' },
      floor: { type: Number, default: 1 },
      type: { type: String, enum: BED_TYPES, default: 'General' },
      status: { type: String, enum: BED_STATUS, default: 'available', index: true },
      patient: { type: Schema.Types.ObjectId, ref: 'Patient', default: null },
      dailyRate: { type: Number, default: 0 },
    },
    { timestamps: true }
  )
);

/* ---------- Patient ---------- */
export const PRIORITY = ['routine', 'urgent', 'critical'];

export const Patient = mongoose.model(
  'Patient',
  new Schema(
    {
      patientId: { type: String, unique: true, index: true },
      name: { type: String, required: true, trim: true, maxlength: 80 },
      age: { type: Number, required: true, min: 0, max: 120 },
      gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
      phone: { type: String, trim: true, default: '' },
      condition: { type: String, required: true, trim: true, maxlength: 300 },
      department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
      priority: { type: String, enum: PRIORITY, default: 'routine' },
      status: { type: String, enum: ['waiting', 'admitted', 'discharged'], default: 'waiting', index: true },
      bed: { type: Schema.Types.ObjectId, ref: 'Bed', default: null },
      bedCode: { type: String, default: '' },
      doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', default: null },
      admittedAt: Date,
      dischargedAt: Date,
      notes: { type: String, default: '', maxlength: 1000 },
      registeredBy: { type: String, default: '' },
    },
    { timestamps: true }
  )
);

/* ---------- Contact message ---------- */
export const Contact = mongoose.model(
  'Contact',
  new Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, trim: true, maxlength: 20, default: '' },
      message: { type: String, required: true, trim: true, maxlength: 2000 },
    },
    { timestamps: true }
  )
);
