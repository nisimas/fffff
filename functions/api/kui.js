// Cloudflare Pages Function: /api/kui
// Configure DEEPSEEK_API_KEY as a Cloudflare Pages secret.
// Never place API credentials in HTML, browser JavaScript, or a public repository.
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin');
  const host = new URL(request.url).origin;
  if (origin && origin !== host) return Response.json({ error: 'Origin not allowed' }, { status: 403 });
  if (!env.DEEPSEEK_API_KEY) return Response.json({ error: 'Server AI key is not configured' }, { status: 503 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > 16000) return Response.json({ error: 'Prompt must be 1–16000 characters' }, { status: 400 });
  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-flash',
      messages: [
        { role: 'system', content: 'Ты — доброжелательный текстовый помощник учебного сайта FUNCTION LAB по математике. Отвечай по-русски, просто и точно, не более 120 слов, объясняй термины и при необходимости приводи короткий жизненный пример. Формулы пиши обычным текстом.' },
        { role: 'user', content: prompt }
      ],
      stream: false
    })
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return Response.json({ error: 'AI provider request failed' }, { status: upstream.status === 429 ? 429 : 502 });
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return Response.json({ error: 'Empty AI response' }, { status: 502 });
  return Response.json({ text }, { headers: { 'Cache-Control': 'no-store' } });
}
