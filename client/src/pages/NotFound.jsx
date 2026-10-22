import { Link } from 'react-router-dom';
import usePageTitle from '../lib/usePageTitle.js';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="state empty">
      <h1>Page not found</h1>
      <p>This page does not exist.</p>
      <Link className="btn" to="/">Go home</Link>
    </div>
  );
}
