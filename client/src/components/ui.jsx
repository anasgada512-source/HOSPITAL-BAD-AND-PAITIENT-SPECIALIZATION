import { STATUS } from '../config.js';

export const Loading = ({ text = 'Loading...' }) => (
  <div className="state" role="status"><span className="spinner" aria-hidden="true" />{text}</div>
);

export const ErrorBox = ({ error, retry }) => (
  <div className="state error" role="alert">
    <strong>Something went wrong.</strong>
    <span>{error?.message || String(error)}</span>
    {retry && <button className="btn small" onClick={retry}>Try again</button>}
  </div>
);

export const Empty = ({ children }) => <div className="state empty">{children}</div>;

// Status is shown with text and a letter, never colour alone
export const StatusBadge = ({ status }) => {
  const s = STATUS[status] || { label: status, letter: '?' };
  return <span className={'badge st-' + status}><i aria-hidden="true">{s.letter}</i>{s.label}</span>;
};

export const PriorityBadge = ({ priority }) => (
  <span className={'badge pr-' + priority}>{priority}</span>
);

export function BedBar({ beds }) {
  const t = beds.total || 1;
  const seg = (k) => ({ width: (beds[k] / t) * 100 + '%' });
  return (
    <div className="bedbar" role="img" aria-label={`${beds.available} of ${beds.total} beds available`}>
      <span className="b-available" style={seg('available')} />
      <span className="b-occupied" style={seg('occupied')} />
      <span className="b-cleaning" style={seg('cleaning')} />
      <span className="b-maintenance" style={seg('maintenance')} />
    </div>
  );
}

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

export function Notice({ kind = 'ok', children }) {
  if (!children) return null;
  return <div className={'notice ' + kind} role={kind === 'err' ? 'alert' : 'status'}>{children}</div>;
}
