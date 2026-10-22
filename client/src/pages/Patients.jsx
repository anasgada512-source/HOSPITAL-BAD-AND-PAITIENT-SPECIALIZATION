import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../lib/useFetch.js';
import usePageTitle from '../lib/usePageTitle.js';
import { Loading, ErrorBox, Empty, PriorityBadge, fmtDate } from '../components/ui.jsx';

const TABS = [['', 'All'], ['waiting', 'Waiting'], ['admitted', 'Admitted'], ['discharged', 'Discharged']];

export default function Patients() {
  usePageTitle('Patients');
  const [status, setStatus] = useState('');
  const [dept, setDept] = useState('');
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const depts = useFetch('/departments');
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (dept) qs.set('department', dept);
  if (term) qs.set('q', term);
  const { data, error, loading, reload } = useFetch('/patients?' + qs.toString(), { pollMs: 20000 });

  return (
    <>
      <div className="page-head between">
        <h1>Patients</h1>
        <Link to="/patients/new" className="btn">Register patient</Link>
      </div>
      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Status">
          {TABS.map(([v, l]) => <button key={v} className={'tab' + (status === v ? ' on' : '')} aria-pressed={status === v} onClick={() => setStatus(v)}>{l}</button>)}
        </div>
        <label>Specialization
          <select value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All</option>
            {depts.data?.map((d) => <option key={d._id} value={d.slug}>{d.name}</option>)}
          </select>
        </label>
        <form onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); }} className="search">
          <label className="sr">Search<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, ID or phone" /></label>
          <button className="btn small">Search</button>
        </form>
      </div>

      {loading && !data && <Loading />}
      {error && !data && <ErrorBox error={error} retry={reload} />}
      {data?.length === 0 && <Empty>No patients match.</Empty>}
      {data?.length > 0 && (
        <div className="table-wrap"><table>
          <thead><tr><th>Patient</th><th>Specialization</th><th>Priority</th><th>Status</th><th>Bed</th><th>Doctor</th><th>Registered</th></tr></thead>
          <tbody>
            {data.map((p) => (
              <tr key={p._id}>
                <td><Link to={'/patients/' + p._id}><strong>{p.name}</strong></Link><br /><small className="muted">{p.patientId}, {p.age}y {p.gender}</small></td>
                <td>{p.department?.icon} {p.department?.name}</td>
                <td><PriorityBadge priority={p.priority} /></td>
                <td><span className={'badge ps-' + p.status}>{p.status}</span></td>
                <td>{p.bedCode || '-'}</td>
                <td>{p.doctor?.name || '-'}</td>
                <td>{fmtDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );
}
