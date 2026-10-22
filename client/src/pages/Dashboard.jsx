import { Link } from 'react-router-dom';
import useFetch from '../lib/useFetch.js';
import usePageTitle from '../lib/usePageTitle.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading, ErrorBox, Empty, PriorityBadge, fmtDate } from '../components/ui.jsx';

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const { data: o, error, loading, reload } = useFetch('/stats/overview', { pollMs: 20000 });

  if (loading && !o) return <Loading />;
  if (error && !o) return <ErrorBox error={error} retry={reload} />;
  if (!o) return null;

  return (
    <>
      <div className="page-head between">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Hello {user.name}. Staff ID {user.userId}, role {user.role}.</p>
        </div>
        <Link to="/patients/new" className="btn">Register patient</Link>
      </div>

      <dl className="numbers">
        <div><dt>Occupancy</dt><dd>{o.occupancy}<small>%</small></dd></div>
        <div><dt>Beds free</dt><dd>{o.availableBeds}<small> / {o.totalBeds}</small></dd></div>
        <div><dt>Admitted</dt><dd>{o.admitted}</dd></div>
        <div><dt>Waiting</dt><dd>{o.waitingCount}</dd></div>
        <div><dt>Discharged today</dt><dd>{o.dischargedToday}</dd></div>
      </dl>

      <div className="two wide-left">
        <section className="panel">
          <h2>Waiting queue</h2>
          {o.queue.length === 0 ? <Empty>No one is waiting.</Empty> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Patient</th><th>Needs</th><th>Priority</th><th>Since</th><th /></tr></thead>
              <tbody>
                {o.queue.map((p) => (
                  <tr key={p._id}>
                    <td><strong>{p.name}</strong><br /><small className="muted">{p.patientId}, {p.condition}</small></td>
                    <td>{p.department?.icon} {p.department?.name}</td>
                    <td><PriorityBadge priority={p.priority} /></td>
                    <td>{fmtDate(p.createdAt)}</td>
                    <td><Link className="btn small" to={'/patients/' + p._id}>Admit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </section>

        <section className="panel">
          <h2>Occupancy by specialization</h2>
          <ul className="occ">
            {o.byDepartment.map((d) => (
              <li key={d.slug}>
                <div className="occ-row"><span>{d.icon} {d.name}</span><span>{d.occupied}/{d.total}{d.waiting ? ', ' + d.waiting + ' waiting' : ''}</span></div>
                <div className="meter" role="img" aria-label={d.name + ' ' + d.occupancy + ' percent occupied'}><span style={{ width: d.occupancy + '%' }} className={d.occupancy >= 90 ? 'hot' : ''} /></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
