import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import usePageTitle from '../lib/usePageTitle.js';
import { Notice } from '../components/ui.jsx';

export default function Login({ register: isRegister }) {
  usePageTitle(isRegister ? 'Create account' : 'Staff login');
  const { login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (isRegister) await register(f.name, f.email, f.password);
      else await login(f.email, f.password);
      nav(loc.state?.from || '/dashboard', { replace: true });
    } catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth">
      <h1>{isRegister ? 'Create staff account' : 'Staff login'}</h1>
      <p className="muted">{isRegister ? 'You get a unique staff ID (HMS-00001 style) after signing up.' : 'Log in to manage patients and beds.'}</p>
      <form onSubmit={submit} className="form" noValidate>
        {isRegister && <label>Full name<input value={f.name} onChange={set('name')} autoComplete="name" required /></label>}
        <label>Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></label>
        <label>Password<input type="password" value={f.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required />
          {isRegister && <small className="muted">At least 8 characters.</small>}
        </label>
        <Notice kind="err">{err}</Notice>
        <button className="btn" disabled={busy}>{busy ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}</button>
      </form>
      <p>{isRegister ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New staff member? <Link to="/register">Create an account</Link></>}</p>
    </div>
  );
}
