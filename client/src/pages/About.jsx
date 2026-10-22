import usePageTitle from '../lib/usePageTitle.js';
import { SITE } from '../config.js';

export default function About() {
  usePageTitle('About');
  return (
    <div className="prose">
      <h1>About {SITE.name}</h1>
      <p className="lead">{SITE.name} is a MERN stack hospital bed and patient specialization management system. It keeps one honest picture of which beds are free, which patients are waiting and which doctors are on duty.</p>
      <h2>What it does</h2>
      <ul>
        <li>Live bed availability for every specialization, with ICU, private, general and emergency beds.</li>
        <li>Patient queue sorted by priority: critical, urgent, routine.</li>
        <li>Admit a patient to a matching bed in one step. The least busy on-duty doctor of that specialization is assigned.</li>
        <li>Discharge frees the bed into a cleaning state until staff mark it ready.</li>
        <li>Two roles: staff run daily work, admins manage specializations, doctors and beds.</li>
      </ul>
      <h2>Founder</h2>
      <p><strong>{SITE.founder}</strong>, {SITE.founderRole}.<br />
        Phone: <a href={SITE.phoneHref}>{SITE.phone}</a><br />
        Email: <a href={'mailto:' + SITE.email}>{SITE.email}</a></p>
      <h2>Important</h2>
      <p>The patients, doctors and numbers shown in this demo are fictional sample data. This is a learning and portfolio project, not a certified clinical system. Real patient records need legal compliance, audit logs and security review before use.</p>
    </div>
  );
}
