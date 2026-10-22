import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { SITE } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

function ThemeToggle() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('cb_theme', theme); } catch { /* ignore */ }
  }, [theme]);
  return (
    <button className="icon-btn" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <header className="topbar">
        <div className="wrap bar">
          <Link to="/" className="brand" onClick={close}>
            <img src="/favicon.svg" alt="" width="30" height="30" />
            <span>{SITE.name}</span>
          </Link>
          <button className="icon-btn menu" aria-expanded={open} aria-controls="nav" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
          <nav id="nav" className={open ? 'open' : ''} onClick={close}>
            <NavLink to="/specializations">Specializations</NavLink>
            <NavLink to="/doctors">Doctors</NavLink>
            {user && <NavLink to="/dashboard">Dashboard</NavLink>}
            {user && <NavLink to="/patients">Patients</NavLink>}
            {user && <NavLink to="/beds">Beds</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
            <NavLink to="/about">About</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
          <div className="bar-right">
            <ThemeToggle />
            {user ? (
              <>
                <span className="who" title={user.email}>{user.userId}</span>
                <button className="btn small ghost" onClick={() => { logout(); nav('/'); }}>Log out</button>
              </>
            ) : (
              <Link to="/login" className="btn small">Staff login</Link>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="wrap">{children}</main>
      <footer className="foot">
        <div className="wrap foot-grid">
          <div>
            <strong>{SITE.name}</strong>
            <p>{SITE.tagline}. Sample data in this demo is fictional.</p>
          </div>
          <div>
            <strong>{SITE.founder}</strong>, {SITE.founderRole}
            <p><a href={SITE.phoneHref}>{SITE.phone}</a><br /><a href={'mailto:' + SITE.email}>{SITE.email}</a></p>
          </div>
          <div>
            <Link to="/specializations">Specializations</Link><br />
            <Link to="/doctors">Doctors</Link><br />
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
