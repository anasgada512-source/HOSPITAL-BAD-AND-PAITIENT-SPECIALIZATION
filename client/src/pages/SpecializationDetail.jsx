import { Link, useParams } from 'react-router-dom';
import useFetch from '../lib/useFetch.js';
import usePageTitle from '../lib/usePageTitle.js';
import { Loading, ErrorBox, BedBar } from '../components/ui.jsx';
import { BED_TYPES } from '../config.js';

export default function SpecializationDetail() {
  const { slug } = useParams();
  const { data: d, error, loading, reload } = useFetch('/departments/' + encodeURIComponent(slug), { pollMs: 30000 });
  usePageTitle(d?.name || 'Specialization');

  if (loading && !d) return <Loading />;
  if (error && !d) return <ErrorBox error={error} retry={reload} />;
  if (!d) return null;

  return (
    <>
      <p><Link to="/specializations">&larr; All specializations</Link></p>
      <div className="page-head">
        <span className="dept-icon big" aria-hidden="true">{d.icon}</span>
        <div>
          <h1>{d.name}</h1>
          <p className="muted">Floor {d.floor}. {d.description}</p>
        </div>
      </div>

      {d.treats?.length > 0 && (
        <p className="chips">{d.treats.map((t) => <span key={t} className="chip">{t}</span>)}</p>
      )}

      <section className="panel">
        <h2>Beds</h2>
        <BedBar beds={d.beds} />
        <dl className="numbers small">
          <div><dt>Available</dt><dd>{d.beds.available}</dd></div>
          <div><dt>Occupied</dt><dd>{d.beds.occupied}</dd></div>
          <div><dt>Cleaning</dt><dd>{d.beds.cleaning}</dd></div>
          <div><dt>Maintenance</dt><dd>{d.beds.maintenance}</dd></div>
        </dl>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Bed type</th><th>Free</th><th>Total</th></tr></thead>
            <tbody>
              {BED_TYPES.filter((t) => d.bedsByType?.[t]).map((t) => (
                <tr key={t}><td>{t}</td><td>{d.bedsByType[t].available}</td><td>{d.bedsByType[t].total}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Doctors</h2>
        <div className="grid">
          {d.doctors?.map((x) => (
            <div key={x._id} className="card">
              <h3>{x.name}</h3>
              <p className="muted">{x.qualification}</p>
              <p>{x.experienceYears} years experience</p>
              <p className="muted">Days: {x.availableDays?.join(', ') || '-'}</p>
              <span className={'badge ' + (x.onDuty ? 'st-available' : 'st-maintenance')}><i aria-hidden="true">{x.onDuty ? 'Y' : 'N'}</i>{x.onDuty ? 'On duty' : 'Off duty'}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
