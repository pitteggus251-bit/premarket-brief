const decode = s => s.replace(/<[^>]*>/g, '')
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'");

module.exports = async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'q(검색어)가 필요합니다' });
  const id = process.env.NAVER_CLIENT_ID, secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return res.status(500).json({ error: '환경변수 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET이 설정되지 않았습니다' });

  const url = 'https://naverapihub.apigw.ntruss.com/search/v1/news?query=' +
    encodeURIComponent(q) + '&display=5&sort=date&format=json';
  try {
    const r = await fetch(url, { headers: { 'X-NCP-APIGW-API-KEY-ID': id, 'X-NCP-APIGW-API-KEY': secret } });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });
    const items = (data.items || []).map(i => {
      let source = '';
      try { source = new URL(i.originallink || i.link).hostname.replace(/^www\./, ''); } catch (e) {}
      return { title: decode(i.title), link: i.link, source, pubDate: i.pubDate };
    });
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).json({ items });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
