import { useState } from 'react';
import { api } from '../lib/api.js';
import usePageTitle from '../lib/usePageTitle.js';
import { Notice } from '../components/ui.jsx';
import { SITE } from '../config.js';

export default function Contact() {
  usePageTitle('Contact');
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '' });
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setRes(null);
    try {
      const d = await api('/contact', { method: 'POST', body: f });
      setRes({ kind: 'ok', text: d.message });
      setF({ name: '', email: '', phone: '', message: '' });
    } catch (e2) { setRes({ kind: 'err', text: e2.message }); }
    finally { setBusy(false); }
  }

  return (
    <div className="two">
      <div>
        <h1>Contact</h1>
        <p className="lead">Questions, feedback or want this for your hospital project? Write to {SITE.founder}.</p>
        <p>Phone: <a href={SITE.phoneHref}>{SITE.phone}</a><br />Email: <a href={'mailto:' + SITE.email}>{SITE.email}</a></p>
      </div>
      <form onSubmit={submit} className="form panel" noValidate>
        <label>Name<input value={f.name} onChange={set('name')} required /></label>
        <label>Email<input type="email" value={f.email} onChange={set('email')} required /></label>
        <label>Phone (optional)<input value={f.phone} onChange={set('phone')} inputMode="tel" /></label>
        <label>Message<textarea rows="5" value={f.message} onChange={set('message')} required /></label>
        <Notice kind={res?.kind}>{res?.text}</Notice>
        <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Send message'}</button>
      </form>
    </div>
  );
}
