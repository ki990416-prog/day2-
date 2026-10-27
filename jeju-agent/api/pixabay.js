// Vercel 서버리스 함수: 브라우저 대신 서버에서 Pixabay를 호출해서 API 키가 노출되지 않게 합니다.
// 키는 Vercel 환경변수 PIXABAY_API_KEY 에서 읽습니다.
module.exports = async (req, res) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    return res.status(500).json({ error: '서버에 PIXABAY_API_KEY 환경변수가 설정되지 않았어요.' });
  }

  const q = String(req.query.q || '').trim().slice(0, 100);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  if (!q) return res.status(400).json({ error: '검색어를 입력하세요.' });

  const url = 'https://pixabay.com/api/?' + new URLSearchParams({
    key, q, image_type: 'photo', per_page: '10', page: String(page), lang: 'ko', safesearch: 'true',
  });

  try {
    const r = await fetch(url);
    if (!r.ok) {
      const msg = r.status === 429 ? '요청이 너무 많아요. 잠시 후 다시 시도하세요.'
        : r.status === 400 ? 'Pixabay가 요청을 거부했어요. API 키를 확인하세요.'
        : 'Pixabay 오류 ' + r.status;
      return res.status(502).json({ error: msg });
    }
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json({
      totalHits: data.totalHits,
      hits: data.hits.map(h => ({ webformatURL: h.webformatURL, tags: h.tags, user: h.user, pageURL: h.pageURL })),
    });
  } catch (e) {
    return res.status(502).json({ error: 'Pixabay에 연결하지 못했어요.' });
  }
};
