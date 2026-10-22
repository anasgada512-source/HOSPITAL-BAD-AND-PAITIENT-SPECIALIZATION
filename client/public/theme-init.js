// Apply the saved theme before first paint so there is no flash. External file because the server CSP blocks inline scripts.
try {
  var t = localStorage.getItem('cb_theme');
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
} catch (e) {}
