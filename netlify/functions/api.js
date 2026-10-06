exports.handler = async (ev) => {
  if (ev.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  try {
    if (!process.env.APPS_SCRIPT_URL) throw new Error('Variable APPS_SCRIPT_URL Netlify mein set nahi hai');
    if (!process.env.API_SECRET) throw new Error('Variable API_SECRET Netlify mein set nahi hai');
    const body = { ...JSON.parse(ev.body || '{}'), secret: process.env.API_SECRET };
    const r = await fetch(process.env.APPS_SCRIPT_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), redirect: 'follow' });
    const t = await r.text();
    if (t.trim().startsWith('<')) throw new Error('Google ne web page bheja, JSON nahi. Apps Script deployment ka access "Anyone" karna hai. Status ' + r.status);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: t };
  } catch (err) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: String(err.message || err) }) };
  }
};
