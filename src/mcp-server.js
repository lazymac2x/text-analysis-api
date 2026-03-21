#!/usr/bin/env node

// MCP (Model Context Protocol) server for text-analysis-api
// Communicates over stdio using JSON-RPC 2.0

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

const SERVER_INFO = {
  name: 'text-analysis-mcp',
  version: '1.0.0',
};

const TOOLS = [
  {
    name: 'analyze_sentiment',
    description: 'Analyze sentiment of text. Returns score, label (positive/negative/neutral), confidence, and matched words.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to analyze' },
      },
      required: ['text'],
    },
  },
  {
    name: 'analyze_readability',
    description: 'Calculate readability scores: Flesch-Kincaid Grade, Flesch Reading Ease, Coleman-Liau Index, Automated Readability Index.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to analyze' },
      },
      required: ['text'],
    },
  },
  {
    name: 'extract_keywords',
    description: 'Extract keywords from text using TF-based scoring with stop word removal.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to analyze' },
        maxKeywords: { type: 'number', description: 'Maximum keywords to return (default 10)' },
        minLength: { type: 'number', description: 'Minimum word length (default 3)' },
      },
      required: ['text'],
    },
  },
  {
    name: 'detect_language',
    description: 'Detect the language of text. Supports EN, KO, JA, ZH, ES, FR, DE.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to analyze' },
      },
      required: ['text'],
    },
  },
  {
    name: 'analyze_stats',
    description: 'Get text statistics: word/sentence/paragraph counts, avg lengths, reading time, speaking time.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to analyze' },
      },
      required: ['text'],
    },
  },
  {
    name: 'detect_profanity',
    description: 'Check text for profanity. Returns whether profanity was found and which words.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to check' },
      },
      required: ['text'],
    },
  },
  {
    name: 'summarize_text',
    description: 'Generate an extractive summary of text by selecting the most important sentences.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to summarize' },
        sentences: { type: 'number', description: 'Number of sentences in summary (default 3)' },
      },
      required: ['text'],
    },
  },
  {
    name: 'analyze_all',
    description: 'Run all analyses at once: sentiment, readability, keywords, language detection, stats, profanity, and summary.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to analyze' },
        maxKeywords: { type: 'number', description: 'Maximum keywords (default 10)' },
        sentences: { type: 'number', description: 'Summary sentences (default 3)' },
      },
      required: ['text'],
    },
  },
];

// ─── Tool execution ──────────────────────────────────────────────────────────

function executeTool(name, args) {
  const text = args.text;
  if (!text || typeof text !== 'string') {
    throw new Error('Missing or invalid "text" argument');
  }

  switch (name) {
    case 'analyze_sentiment':
      return analyzeSentiment(text);
    case 'analyze_readability':
      return analyzeReadability(text);
    case 'extract_keywords':
      return extractKeywords(text, { maxKeywords: args.maxKeywords, minLength: args.minLength });
    case 'detect_language':
      return detectLanguage(text);
    case 'analyze_stats':
      return analyzeStats(text);
    case 'detect_profanity':
      return detectProfanity(text);
    case 'summarize_text':
      return summarize(text, { sentences: args.sentences });
    case 'analyze_all':
      return analyzeAll(text, { maxKeywords: args.maxKeywords, sentences: args.sentences });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── JSON-RPC handler ────────────────────────────────────────────────────────

function handleRequest(request) {
  const { method, params, id } = request;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        },
      };

    case 'notifications/initialized':
      return null; // No response for notifications

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS },
      };

    case 'tools/call': {
      const { name, arguments: args } = params;
      try {
        const result = executeTool(name, args || {});
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          },
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Error: ${err.message}` }],
            isError: true,
          },
        };
      }
    }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

// ─── stdio transport ─────────────────────────────────────────────────────────

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  // Process complete lines
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line in buffer

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const request = JSON.parse(trimmed);
      const response = handleRequest(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (err) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
});

process.stderr.write(`${SERVER_INFO.name} v${SERVER_INFO.version} started (stdio)\n`);
