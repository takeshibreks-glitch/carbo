export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { image, mediaType } = req.body;
  if (!image) return res.status(400).json({ error: 'No image' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image }
            },
            {
              type: 'text',
              text: `この食事を分析し、以下のJSONのみ返してください。前後の文章不要。\n\n{"foods":[{"name":"食品名","carbs":数値}],"totalCarbs":数値,"spikeLevel":1〜5の整数,"spikeLevelText":"説明","spikeTiming":"ピーク目安","advice":"美容・健康観点の1〜2文","tip":"改善アドバイス1文"}\n\nspikeLevel: 1=低リスク 2=やや低め 3=中程度 4=やや高め 5=高リスク`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'API error' });
    }

    const data = await response.json();
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);
    res.status(200).json(result);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
