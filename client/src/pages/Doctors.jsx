import { useState } from 'react';
import useFetch from '../lib/useFetch.js';
import usePageTitle from '../lib/usePageTitle.js';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading, ErrorBox, Empty, Notice } from '../components/ui.jsx';

export default function Doctors() {
  usePageTitle('Doctors');
  const { user } = useAuth();
  const [dept, setDept] = useState('');
  const depts = useFetch('/departments');
  const { data, error, loading, reload } = useFetch('/doctors' + (dept ? '?department=' + encodeURIComponent(dept) : ''));
  const [msg, setMsg] = useState('');

  async function toggle(doc) {
    setMsg('');
    try { await api('/doctors/' + doc._id + '/duty', { method: 'PATCH', body: { onDuty: !doc.onDuty } }); reload(); }
    catch (e) { setMsg(e.message); }
  }

  return (
    <>
      <h1>Doctors</h1>
      <div className="toolbar">
        <label>Specialization
          <select value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All</option>
            {depts.data?.map((d) => <option key={d._id} value={d.slug}>{d.name}</option>)}
          </select>
        </label>
      </div>
      <Notice kind="err">{msg}</Notice>
      {loading && !data && <Loading />}
      {error && !data && <ErrorBox error={error} retry={reload} />}
      {data?.length === 0 && <Empty>No doctors found.</Empty>}
      <div className="grid">
        {data?.map((x) => (
          <div key={x._id} className="card">
            <h3>{x.name}</h3>
            <p className="muted">{x.department?.icon} {x.department?.name}</p>
            <p>{x.qualification}</p>
            <p className="muted">{x.experienceYears} years. Days: {x.availableDays?.join(', ') || '-'}</p>
            <div className="row">
              <span className={'badge ' + (x.onDuty ? 'st-available' : 'st-maintenance')}><i aria-hidden="true">{x.onDuty ? 'Y' : 'N'}</i>{x.onDuty ? 'On duty' : 'Off duty'}</span>
              {user && <button className="btn small ghost" onClick={() => toggle(x)}>{x.onDuty ? 'Mark off duty' : 'Mark on duty'}</button>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
