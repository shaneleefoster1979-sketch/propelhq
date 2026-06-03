
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  try {
    const { prompt, max_tokens } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Claude API error', detail: errText });
    }
    const data = await response.json();
    const text = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
