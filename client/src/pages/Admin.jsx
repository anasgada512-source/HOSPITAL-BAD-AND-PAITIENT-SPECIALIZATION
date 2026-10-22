import { useState } from 'react';
import useFetch from '../lib/useFetch.js';
import { api } from '../lib/api.js';
import usePageTitle from '../lib/usePageTitle.js';
import { Notice, Loading, Empty, fmtDate } from '../components/ui.jsx';
import { BED_TYPES } from '../config.js';

function useForm(initial, path, onDone) {
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await api(path, { method: 'POST', body: f }); setMsg({ kind: 'ok', text: 'Saved.' }); setF(initial); onDone && onDone(); }
    catch (e2) { setMsg({ kind: 'err', text: e2.message }); }
    finally { setBusy(false); }
  }
  return { f, set, submit, msg, busy };
}

export default function Admin() {
  usePageTitle('Admin');
  const depts = useFetch('/departments');
  const doctors = useFetch('/doctors');
  const messages = useFetch('/contact');
  const reloadAll = () => { depts.reload(); doctors.reload(); };

  const dept = useForm({ name: '', icon: '', floor: 1, description: '', treats: '' }, '/departments', reloadAll);
  const doc = useForm({ name: '', department: '', qualification: '', experienceYears: 5, availableDays: 'Mon,Tue,Wed,Thu,Fri' }, '/doctors', reloadAll);
  const bed = useForm({ code: '', department: '', ward: '', floor: 1, type: 'General', dailyRate: '' }, '/beds', reloadAll);
  const [rmMsg, setRmMsg] = useState('');

  async function remove(path, label) {
    if (!window.confirm('Delete ' + label + '?')) return;
    setRmMsg('');
    try { await api(path, { method: 'DELETE' }); reloadAll(); } catch (e) { setRmMsg(e.message); }
  }

  const DeptSelect = ({ form }) => (
    <label>Specialization
      <select value={form.f.department} onChange={form.set('department')} required>
        <option value="">Choose...</option>
        {depts.data?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <h1>Admin</h1>
      <p className="muted">Add specializations, doctors and beds. Changes show up on the public bed board straight away.</p>
      <div className="grid forms">
        <form className="form panel" onSubmit={dept.submit}>
          <h2>Add specialization</h2>
          <label>Name<input value={dept.f.name} onChange={dept.set('name')} required /></label>
          <div className="cols">
            <label>Icon (emoji)<input value={dept.f.icon} onChange={dept.set('icon')} maxLength="4" /></label>
            <label>Floor<input type="number" min="0" value={dept.f.floor} onChange={dept.set('floor')} /></label>
          </div>
          <label>Description<input value={dept.f.description} onChange={dept.set('description')} /></label>
          <label>Treats (comma separated)<input value={dept.f.treats} onChange={dept.set('treats')} /></label>
          <Notice kind={dept.msg?.kind}>{dept.msg?.text}</Notice>
          <button className="btn" disabled={dept.busy}>Add specialization</button>
        </form>

        <form className="form panel" onSubmit={doc.submit}>
          <h2>Add doctor</h2>
          <label>Name<input value={doc.f.name} onChange={doc.set('name')} required /></label>
          <DeptSelect form={doc} />
          <label>Qualification<input value={doc.f.qualification} onChange={doc.set('qualification')} /></label>
          <div className="cols">
            <label>Experience (years)<input type="number" min="0" value={doc.f.experienceYears} onChange={doc.set('experienceYears')} /></label>
            <label>Days<input value={doc.f.availableDays} onChange={doc.set('availableDays')} /></label>
          </div>
          <Notice kind={doc.msg?.kind}>{doc.msg?.text}</Notice>
          <button className="btn" disabled={doc.busy}>Add doctor</button>
        </form>

        <form className="form panel" onSubmit={bed.submit}>
          <h2>Add bed</h2>
          <label>Bed code (e.g. CAR-110)<input value={bed.f.code} onChange={bed.set('code')} required /></label>
          <DeptSelect form={bed} />
          <div className="cols">
            <label>Type<select value={bed.f.type} onChange={bed.set('type')}>{BED_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label>Floor<input type="number" min="0" value={bed.f.floor} onChange={bed.set('floor')} /></label>
          </div>
          <div className="cols">
            <label>Ward<input value={bed.f.ward} onChange={bed.set('ward')} /></label>
            <label>Daily rate (Rs)<input type="number" min="0" value={bed.f.dailyRate} onChange={bed.set('dailyRate')} placeholder="auto" /></label>
          </div>
          <Notice kind={bed.msg?.kind}>{bed.msg?.text}</Notice>
          <button className="btn" disabled={bed.busy}>Add bed</button>
        </form>
      </div>

      <section className="panel">
        <h2>Remove</h2>
        <Notice kind="err">{rmMsg}</Notice>
        <div className="two">
          <div>
            <h3>Specializations</h3>
            <ul className="plain">{depts.data?.map((d) => <li key={d._id} className="row between">{d.icon} {d.name}<button className="btn small ghost" onClick={() => remove('/departments/' + d._id, d.name)}>Delete</button></li>)}</ul>
          </div>
          <div>
            <h3>Doctors</h3>
            <ul className="plain">{doctors.data?.map((d) => <li key={d._id} className="row between">{d.name}<button className="btn small ghost" onClick={() => remove('/doctors/' + d._id, d.name)}>Delete</button></li>)}</ul>
          </div>
        </div>
        <p className="muted">A specialization can only be deleted when it has no beds, doctors or active patients.</p>
      </section>

      <section className="panel">
        <h2>Contact messages</h2>
        {messages.loading && !messages.data && <Loading />}
        {messages.data?.length === 0 && <Empty>No messages yet.</Empty>}
        <ul className="plain">
          {messages.data?.map((m) => (
            <li key={m._id}><strong>{m.name}</strong> ({m.email}{m.phone ? ', ' + m.phone : ''}) <small className="muted">{fmtDate(m.createdAt)}</small><br />{m.message}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
