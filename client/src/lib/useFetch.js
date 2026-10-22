import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

// Loads data from the API. Re-runs when `path` changes. Optional polling keeps live boards fresh.
export default function useFetch(path, { pollMs = 0 } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!path) return undefined;
    let alive = true;
    // show the spinner only on the very first load, so polling never flashes the page
    setState((s) => (s.data && tick > 0 ? s : { ...s, loading: true, error: null }));
    api(path)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState((s) => ({ data: s.data, error, loading: false })));
    return () => { alive = false; };
  }, [path, tick]);

  useEffect(() => {
    if (!pollMs || !path) return undefined;
    const id = setInterval(() => { if (!document.hidden) reload(); }, pollMs);
    return () => clearInterval(id);
  }, [pollMs, path, reload]);

  return { ...state, reload };
}
