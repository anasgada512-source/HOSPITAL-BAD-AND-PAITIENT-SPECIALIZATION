import useFetch from '../lib/useFetch.js';
import usePageTitle from '../lib/usePageTitle.js';
import { Loading, ErrorBox } from '../components/ui.jsx';
import { DeptCard, Legend } from './Home.jsx';

export default function Specializations() {
  usePageTitle('Specializations');
  const { data, error, loading, reload } = useFetch('/departments', { pollMs: 30000 });
  return (
    <>
      <h1>Specializations</h1>
      <p className="lead">Pick a specialization to see its beds, wards and doctors.</p>
      {loading && !data && <Loading />}
      {error && !data && <ErrorBox error={error} retry={reload} />}
      <div className="grid">{data?.map((d) => <DeptCard key={d._id} d={d} />)}</div>
      <Legend />
    </>
  );
}
