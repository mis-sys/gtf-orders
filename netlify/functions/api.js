// Proxy: browser -> Netlify -> Apps Script. Keeps API_SECRET and the script URL off the client.
// Google's /exec address sometimes answers a single call with an HTML error page (404/5xx) even though the
// script is fine. Such a reply means the script did not run, so we try once more before showing an error.
const READS = /^(catalogue|myOrders|myTickets|getQuestions|staffConfig|staffMe|staffBadge|staffOrders|staffTickets|staffStock|notifList|scoreboard|deptList)$/;
const H = { 'Content-Type': 'application/json' };
const out = (o) => ({ statusCode: 200, headers: H, body: JSON.stringify(o) });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
exports.handler = async (ev) => {
  if (ev.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  const url = process.env.APPS_SCRIPT_URL, secret = process.env.API_SECRET;
  if (!url || !secret) return out({ ok: false, error: 'Netlify variables APPS_SCRIPT_URL ya API_SECRET set nahi hain.' });
  let body;
  try { body = JSON.parse(ev.body || '{}'); } catch (e) { return out({ ok: false, error: 'Bad request' }); }
  const payload = JSON.stringify({ ...body, secret });
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: payload, redirect: 'follow' });
      const t = await r.text();
      try { JSON.parse(t); return { statusCode: 200, headers: H, body: t }; } catch (e) { /* not JSON: Google error page */ }
      const again = i === 0 && (r.status === 404 || r.status >= 500 || READS.test(String(body.action)));
      if (!again) return out({ ok: false, error: 'Google ne web page bheja, JSON nahi (status ' + r.status + '). Thodi der baad dobara try karo. Baar-baar aaye to Apps Script deployment check karo: Execute as Me, access Anyone, aur URL /exec wala.' });
    } catch (err) {
      if (i === 1) return out({ ok: false, error: 'Backend unreachable: ' + err.message });
    }
    await wait(800);
  }
};
