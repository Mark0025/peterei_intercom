const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || '',
    'X-Title': process.env.SITE_NAME || '',
  },
});

// POST /PeteAI/ - Basic chat agent
router.post('/', async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: 'Missing message in request body' });
    }
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [{ role: 'user', content: userMessage }],
    });
    res.json({ reply: completion.choices[0].message });
  } catch (err) {
    res.status(500).json({ error: err.message || 'AI agent error' });
  }
});

module.exports = router; 