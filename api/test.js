export default async function handler(req, res) {
  const lines = [];
  lines.push('=== PitchWise Diagnostic ===');
  lines.push('');
  lines.push('1. Function is deployed and running: YES');
  lines.push('');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    lines.push('2. API key found: NO  <-- THIS IS THE PROBLEM');
    lines.push('   The ANTHROPIC_API_KEY environment variable is missing or empty.');
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(lines.join('\n'));
  }
  lines.push('2. API key found: YES');
  lines.push('   Key starts with: ' + apiKey.slice(0, 7));
  lines.push('   Key length: ' + apiKey.length + ' characters');
  lines.push('');
  lines.push('3. Testing a real call to Claude...');
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Reply with exactly: PITCHWISE OK' }],
      }),
    });
    const status = response.status;
    const raw = await response.text();
    if (status === 200) {
      lines.push('   Claude responded: SUCCESS (status 200)');
      lines.push('   Everything works! The AI is connected correctly.');
      lines.push('');
      lines.push('   Raw response: ' + raw.slice(0, 300));
    } else {
      lines.push('   Claude responded with an ERROR. Status code: ' + status);
      lines.push('   <-- THIS IS THE PROBLEM. The message below says why:');
      lines.push('');
      lines.push('   ' + raw.slice(0, 500));
      lines.push('');
      if (status === 401) lines.push('   MEANING: The API key is invalid or mistyped.');
      if (status === 400) lines.push('   MEANING: Bad request, possibly the model name.');
      if (status === 429) lines.push('   MEANING: Rate limited or out of credits.');
      if (status === 402 || raw.includes('credit')) lines.push('   MEANING: Out of credits / billing issue.');
    }
  } catch (err) {
    lines.push('   The call threw an error: ' + err.message);
  }
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(lines.join('\n'));
}
