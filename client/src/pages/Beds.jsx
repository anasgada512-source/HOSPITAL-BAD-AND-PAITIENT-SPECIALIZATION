import { useState } from 'react';
import useFetch from '../lib/useFetch.js';
import { api } from '../lib/api.js';
import usePageTitle from '../lib/usePageTitle.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading, ErrorBox, Empty, StatusBadge, Notice } from '../components/ui.jsx';
import { BED_TYPES, STATUS } from '../config.js';
import { Legend } from './Home.jsx';

export default function Beds() {
  usePageTitle('Beds');
  const { user } = useAuth();
  const [dept, setDept] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const depts = useFetch('/departments');
  const qs = new URLSearchParams();
  if (dept) qs.set('department', dept);
  if (type) qs.set('type', type);
  if (status) qs.set('status', status);
  const { data, error, loading, reload } = useFetch('/beds?' + qs.toString(), { pollMs: 15000 });
  const [msg, setMsg] = useState('');

  async function setBed(b, s) {
    setMsg('');
    try { await api('/beds/' + b._id, { method: 'PATCH', body: { status: s } }); reload(); }
    catch (e) { setMsg(e.message); reload(); }
  }

  return (
    <>
      <h1>Beds</h1>
      <div className="toolbar">
        <label>Specialization<select value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All</option>{depts.data?.map((d) => <option key={d._id} value={d.slug}>{d.name}</option>)}</select></label>
        <label>Type<select value={type} onChange={(e) => setType(e.target.value)}><option value="">All</option>{BED_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
      </div>
      <Notice kind="err">{msg}</Notice>
      {loading && !data && <Loading />}
      {error && !data && <ErrorBox error={error} retry={reload} />}
      {data?.length === 0 && <Empty>No beds match.</Empty>}
      <div className="beds">
        {data?.map((b) => (
          <div key={b._id} className={'bed st-card-' + b.status}>
            <div className="bed-top"><strong className="mono">{b.code}</strong><StatusBadge status={b.status} /></div>
            <div className="muted">{b.department?.icon} {b.department?.name}</div>
            <div>{b.type}, {b.ward || 'ward'}, floor {b.floor}</div>
            <div className="muted">Rs {b.dailyRate?.toLocaleString('en-IN')} per day</div>
            {b.patient && <div className="bed-patient"><strong>{b.patient.name}</strong><br /><small>{b.patient.patientId}, {b.patient.priority}</small></div>}
            {b.status !== 'occupied' && (
              <div className="row wrap">
                {b.status !== 'available' && <button className="btn small" onClick={() => setBed(b, 'available')}>Mark ready</button>}
                {b.status !== 'cleaning' && <button className="btn small ghost" onClick={() => setBed(b, 'cleaning')}>Cleaning</button>}
                {b.status !== 'maintenance' && <button className="btn small ghost" onClick={() => setBed(b, 'maintenance')}>Maintenance</button>}
              </div>
            )}
          </div>
        ))}
      </div>
      <Legend />
      {user.role !== 'admin' && <p className="muted">Only admins can add or remove beds.</p>}
    </>
  );
}
