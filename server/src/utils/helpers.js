import mongoose from 'mongoose';

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
export const isId = (v) => typeof v === 'string' && mongoose.isValidObjectId(v);

// Only plain strings: blocks NoSQL operator objects like { $ne: null }
export const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Runs tasks with the same key one after another (inside this server process).
// Used so two people can never claim the same bed at the same moment, on top of the
// atomic "only if still available" database update.
const tails = new Map();
export function withLock(key, task) {
  const prev = tails.get(key) || Promise.resolve();
  const run = prev.then(task, task);
  const tail = run.catch(() => {});
  tails.set(key, tail);
  tail.then(() => { if (tails.get(key) === tail) tails.delete(key); });
  return run;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
