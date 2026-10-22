import { Link } from 'react-router-dom';
import useFetch from '../lib/useFetch.js';
import usePageTitle from '../lib/usePageTitle.js';
import { Loading, ErrorBox, BedBar } from '../components/ui.jsx';
import { SITE } from '../config.js';

export function DeptCard({ d }) {
  return (
    <Link to={'/specializations/' + d.slug} className="card dept">
      <div className="dept-head"><span className="dept-icon" aria-hidden="true">{d.icon}</span><h3>{d.name}</h3></div>
      <p className="muted">{d.description}</p>
      <BedBar beds={d.beds} />
      <div className="dept-foot">
        <span><strong>{d.beds.available}</strong> of {d.beds.total} beds free</span>
        <span>{d.doctorsOnDuty} on duty</span>
      </div>
    </Link>
  );
}

export default function Home() {
  usePageTitle('');
  const stats = useFetch('/stats', { pollMs: 30000 });
  const depts = useFetch('/departments', { pollMs: 30000 });
  const s = stats.data;

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Live bed board</p>
        <h1>Right bed. Right specialist. Right now.</h1>
        <p className="lead">{SITE.name} shows which beds are free in every specialization, queues patients by urgency and assigns an on-duty doctor when a bed is given.</p>
        <div className="hero-cta">
          <Link to="/specializations" className="btn">See bed availability</Link>
          <Link to="/login" className="btn ghost">Staff login</Link>
        </div>
        {s && (
          <dl className="numbers">
            <div><dt>Beds free now</dt><dd>{s.available}<small> / {s.beds}</small></dd></div>
            <div><dt>Specializations</dt><dd>{s.departments}</dd></div>
            <div><dt>Doctors on duty</dt><dd>{s.doctorsOnDuty}<small> / {s.doctors}</small></dd></div>
          </dl>
        )}
      </section>

      <section>
        <div className="section-head">
          <h2>Availability by specialization</h2>
          <span className="muted">Updates every 30 seconds</span>
        </div>
        {depts.loading && !depts.data && <Loading />}
        {depts.error && !depts.data && <ErrorBox error={depts.error} retry={depts.reload} />}
        <div className="grid">{depts.data?.map((d) => <DeptCard key={d._id} d={d} />)}</div>
        <Legend />
      </section>

      <section className="steps">
        <h2>How it works</h2>
        <ol className="how">
          <li><strong>Register</strong><span>Reception notes the patient, condition, priority and the specialization needed.</span></li>
          <li><strong>Match</strong><span>Critical cases look at ICU first. Routine cases use general beds and keep ICU free.</span></li>
          <li><strong>Admit</strong><span>One click gives the bed and the least busy on-duty doctor of that specialization.</span></li>
          <li><strong>Discharge</strong><span>The bed moves to cleaning, then back to available when staff mark it ready.</span></li>
        </ol>
      </section>
    </>
  );
}

export function Legend() {
  return (
    <p className="legend">
      <span><i className="dot b-available" />Available</span>
      <span><i className="dot b-occupied" />Occupied</span>
      <span><i className="dot b-cleaning" />Cleaning</span>
      <span><i className="dot b-maintenance" />Maintenance</span>
    </p>
  );
}
