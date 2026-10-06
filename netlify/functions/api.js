exports.handler = async (ev) => {
  if (ev.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  try {
    const body = { ...JSON.parse(ev.body || '{}'), secret: process.env.API_SECRET };
    const r = await fetch(process.env.APPS_SCRIPT_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), redirect: 'follow' });
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: await r.text() };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Backend unreachable' }) };
  }
};
