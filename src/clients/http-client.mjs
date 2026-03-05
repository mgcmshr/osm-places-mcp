import { UpstreamError } from '../errors/app-error.mjs';

export async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new UpstreamError(`${res.status} ${res.statusText} ${text}`.trim(), 'HTTP_ERROR');
  }
  return res.json();
}
