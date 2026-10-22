// Small fetch wrapper: adds the JWT, parses JSON, throws readable errors.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const getToken = () => {
  try { return localStorage.getItem('cb_token'); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem('cb_token', t) : localStorage.removeItem('cb_token'); } catch { /* storage blocked */ }
};

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(BASE + '/api' + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Check your internet connection and try again.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error((data && data.message) || 'Request failed (' + res.status + ').');
    err.status = res.status;
    throw err;
  }
  return data;
}
