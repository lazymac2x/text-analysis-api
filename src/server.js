const express = require('express');
const cors = require('cors');
const {
  analyzeSentiment,
  analyzeReadability,
  extractKeywords,
  detectLanguage,
  analyzeStats,
  detectProfanity,
  summarize,
  analyzeAll,
} = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 4600;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ─── Health ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'text-analysis-api', version: '1.0.0' });
});

// ─── Middleware: validate text body ──────────────────────────────────────────

function requireText(req, res, next) {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty "text" field in request body' });
  }
  next();
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

app.post('/api/v1/sentiment', requireText, (req, res) => {
  const result = analyzeSentiment(req.body.text);
  res.json({ success: true, data: result });
});

app.post('/api/v1/readability', requireText, (req, res) => {
  const result = analyzeReadability(req.body.text);
  res.json({ success: true, data: result });
});

app.post('/api/v1/keywords', requireText, (req, res) => {
  const opts = {
    maxKeywords: req.body.maxKeywords || 10,
    minLength: req.body.minLength || 3,
  };
  const result = extractKeywords(req.body.text, opts);
  res.json({ success: true, data: result });
});

app.post('/api/v1/language', requireText, (req, res) => {
  const result = detectLanguage(req.body.text);
  res.json({ success: true, data: result });
});

app.post('/api/v1/stats', requireText, (req, res) => {
  const result = analyzeStats(req.body.text);
  res.json({ success: true, data: result });
});

app.post('/api/v1/analyze', requireText, (req, res) => {
  const opts = {
    maxKeywords: req.body.maxKeywords || 10,
    sentences: req.body.sentences || 3,
  };
  const result = analyzeAll(req.body.text, opts);
  res.json({ success: true, data: result });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`text-analysis-api running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/v1/sentiment');
  console.log('  POST /api/v1/readability');
  console.log('  POST /api/v1/keywords');
  console.log('  POST /api/v1/language');
  console.log('  POST /api/v1/stats');
  console.log('  POST /api/v1/analyze');
});

module.exports = app;
