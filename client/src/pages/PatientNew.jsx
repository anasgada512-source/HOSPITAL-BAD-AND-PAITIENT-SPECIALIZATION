import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from '../lib/useFetch.js';
import { api } from '../lib/api.js';
import usePageTitle from '../lib/usePageTitle.js';
import { Notice } from '../components/ui.jsx';
import { PRIORITIES } from '../config.js';

export default function PatientNew() {
  usePageTitle('Register patient');
  const nav = useNavigate();
  const depts = useFetch('/departments');
  const [f, setF] = useState({ name: '', age: '', gender: 'Male', phone: '', condition: '', department: '', priority: 'routine', notes: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const p = await api('/patients', { method: 'POST', body: { ...f, age: Number(f.age) } });
      nav('/patients/' + p._id);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <div className="narrow">
      <h1>Register patient</h1>
      <p className="muted">After registering you can admit the patient to a matching bed.</p>
      <form onSubmit={submit} className="form panel" noValidate>
        <label>Full name<input value={f.name} onChange={set('name')} required /></label>
        <div className="cols">
          <label>Age<input type="number" min="0" max="120" value={f.age} onChange={set('age')} required /></label>
          <label>Gender
            <select value={f.gender} onChange={set('gender')}><option>Male</option><option>Female</option><option>Other</option></select>
          </label>
        </div>
        <label>Phone (optional)<input value={f.phone} onChange={set('phone')} inputMode="tel" /></label>
        <label>Condition or complaint<input value={f.condition} onChange={set('condition')} required /></label>
        <label>Specialization needed
          <select value={f.department} onChange={set('department')} required>
            <option value="">Choose...</option>
            {depts.data?.map((d) => <option key={d._id} value={d._id}>{d.icon} {d.name} ({d.beds.available} beds free)</option>)}
          </select>
        </label>
        <label>Priority
          <select value={f.priority} onChange={set('priority')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
        </label>
        <label>Notes (optional)<textarea rows="3" value={f.notes} onChange={set('notes')} /></label>
        <Notice kind="err">{err}</Notice>
        <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Register patient'}</button>
      </form>
    </div>
  );
}
