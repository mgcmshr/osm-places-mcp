import { ValidationError } from '../errors/app-error.mjs';

export function requireString(value, name) {
  const v = String(value ?? '').trim();
  if (!v) throw new ValidationError(`${name} is required`);
  return v;
}

export function requireNumber(value, name) {
  const v = Number(value);
  if (!Number.isFinite(v)) throw new ValidationError(`${name} must be a number`);
  return v;
}

export function optionalNumber(value, fallback) {
  const v = Number(value);
  return Number.isFinite(v) ? v : fallback;
}

export function requireLatLon(lat, lon) {
  const la = requireNumber(lat, 'lat');
  const lo = requireNumber(lon, 'lon');
  if (la < -90 || la > 90) throw new ValidationError('lat out of range');
  if (lo < -180 || lo > 180) throw new ValidationError('lon out of range');
  return { lat: la, lon: lo };
}
