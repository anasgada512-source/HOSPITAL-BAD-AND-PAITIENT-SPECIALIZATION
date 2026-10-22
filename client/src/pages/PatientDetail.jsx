import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useFetch from '../lib/useFetch.js';
import { api } from '../lib/api.js';
import usePageTitle from '../lib/usePageTitle.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading, ErrorBox, Notice, PriorityBadge, fmtDate } from '../components/ui.jsx';
import { PRIORITIES } from '../config.js';

export default function PatientDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: p, error, loading, reload } = useFetch('/patients/' + id);
  const waiting = p?.status === 'waiting';
  const sug = useFetch(waiting ? '/patients/' + id + '/suggest' : null);
  usePageTitle(p?.name || 'Patient');
  const [bedId, setBedId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState({ priority: 'routine', notes: '' });
  useEffect(() => { if (p) setEdit({ priority: p.priority, notes: p.notes || '' }); }, [p]);

  async function run(fn, okText) {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ kind: 'ok', text: okText }); reload(); sug.reload(); }
    catch (e) { setMsg({ kind: 'err', text: e.message }); sug.reload(); }
    finally { setBusy(false); }
  }

  if (loading && !p) return <Loading />;
  if (error && !p) return <ErrorBox error={error} retry={reload} />;
  if (!p) return null;

  const admit = () => run(() => api('/patients/' + id + '/admit', { method: 'POST', body: { bedId: bedId || undefined, doctorId: doctorId || undefined } }), 'Patient admitted.');
  const discharge = () => { if (window.confirm('Discharge ' + p.name + '? The bed will move to cleaning.')) run(() => api('/patients/' + id + '/discharge', { method: 'POST' }), 'Patient discharged. Bed is now in cleaning.'); };
  const save = (e) => { e.preventDefault(); run(() => api('/patients/' + id, { method: 'PATCH', body: edit }), 'Changes saved.'); };
  const remove = async () => {
    if (!window.confirm('Delete this record permanently?')) return;
    try { await api('/patients/' + id, { method: 'DELETE' }); nav('/patients'); } catch (e) { setMsg({ kind: 'err', text: e.message }); }
  };

  return (
    <>
      <p><Link to="/patients">&larr; All patients</Link></p>
      <div className="page-head between">
        <div>
          <h1>{p.name}</h1>
          <p className="muted">{p.patientId}, {p.age} years, {p.gender}{p.phone ? ', ' + p.phone : ''}</p>
        </div>
        <div className="row"><PriorityBadge priority={p.priority} /><span className={'badge ps-' + p.status}>{p.status}</span></div>
      </div>
      <Notice kind={msg?.kind}>{msg?.text}</Notice>

      <div className="two">
        <section className="panel">
          <h2>Details</h2>
          <dl className="facts">
            <dt>Condition</dt><dd>{p.condition}</dd>
            <dt>Specialization</dt><dd>{p.department?.icon} {p.department?.name}</dd>
            <dt>Bed</dt><dd>{p.bed ? `${p.bed.code} (${p.bed.type}, ${p.bed.ward || 'ward'}, floor ${p.bed.floor})` : '-'}</dd>
            <dt>Doctor</dt><dd>{p.doctor ? `${p.doctor.name}, ${p.doctor.qualification}` : '-'}</dd>
            <dt>Registered</dt><dd>{fmtDate(p.createdAt)} by {p.registeredBy || '-'}</dd>
            <dt>Admitted</dt><dd>{fmtDate(p.admittedAt)}</dd>
            <dt>Discharged</dt><dd>{fmtDate(p.dischargedAt)}</dd>
            <dt>Notes</dt><dd>{p.notes || '-'}</dd>
          </dl>
          {p.status !== 'discharged' && (
            <form onSubmit={save} className="form inline-form">
              <label>Priority<select value={edit.priority} onChange={(e) => setEdit({ ...edit, priority: e.target.value })}>{PRIORITIES.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Notes<input value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></label>
              <button className="btn small ghost" disabled={busy}>Save changes</button>
            </form>
          )}
        </section>

        <section className="panel">
          {waiting && (
            <>
              <h2>Admit to a bed</h2>
              {sug.loading && !sug.data && <Loading />}
              {sug.data && sug.data.beds.length === 0 && <Notice kind="err">No suitable bed is free in this specialization right now. The patient stays in the queue.</Notice>}
              {sug.data && sug.data.beds.length > 0 && (
                <div className="form">
                  <p className="muted">Best match first for {p.priority} priority ({sug.data.preferredTypes.join(', ')}).</p>
                  <label>Bed
                    <select value={bedId} onChange={(e) => setBedId(e.target.value)}>
                      <option value="">Automatic (best match: {sug.data.beds[0].code})</option>
                      {sug.data.beds.map((b) => <option key={b._id} value={b._id}>{b.code}, {b.type}, {b.ward || 'ward'}</option>)}
                    </select>
                  </label>
                  <label>Doctor
                    <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                      <option value="">Automatic (least busy on duty)</option>
                      {sug.data.doctors.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </label>
                  <button className="btn" disabled={busy} onClick={admit}>{busy ? 'Admitting...' : 'Admit patient'}</button>
                </div>
              )}
            </>
          )}
          {p.status === 'admitted' && (
            <>
              <h2>Currently admitted</h2>
              <p>Bed <strong>{p.bedCode}</strong>. When treatment is done, discharge to free the bed.</p>
              <button className="btn danger" disabled={busy} onClick={discharge}>Discharge patient</button>
            </>
          )}
          {p.status === 'discharged' && <><h2>Discharged</h2><p className="muted">This record is closed.</p></>}
          {user.role === 'admin' && p.status !== 'admitted' && <p><button className="btn small ghost" onClick={remove}>Delete record (admin)</button></p>}
        </section>
      </div>
    </>
  );
}
