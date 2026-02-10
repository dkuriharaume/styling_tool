import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DRAFTS_DATA_DIR
  ? path.resolve(process.env.DRAFTS_DATA_DIR)
  : path.join(__dirname, 'data');
const DATA_FILE = process.env.DRAFTS_DATA_FILE
  ? path.resolve(process.env.DRAFTS_DATA_FILE)
  : path.join(DATA_DIR, 'drafts.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const ensureDataFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ drafts: [] }, null, 2));
  }
};

const readDrafts = async () => {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.drafts) ? parsed.drafts : [];
};

const writeDrafts = async (drafts) => {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify({ drafts }, null, 2));
};

const summarizeDraft = (draft) => {
  const blocks = Array.isArray(draft?.blocks) ? draft.blocks : [];
  const blockCounts = {};
  const listTypes = {};
  let listBlockCount = 0;

  const isNonEmptyListItem = (item) => {
    if (!item || typeof item !== 'object') return Boolean(String(item || '').trim());
    const content = String(item.content ?? item.text ?? item.value ?? item.title ?? item.label ?? item.name ?? '').trim();
    const term = String(item.term ?? '').trim();
    const definition = String(item.definition ?? '').trim();
    return Boolean(content || term || definition);
  };

  blocks.forEach((block) => {
    const type = block?.type || 'unknown';
    blockCounts[type] = (blockCounts[type] || 0) + 1;
    if (type === 'list') {
      const items = Array.isArray(block.items) ? block.items : [];
      const hasItems = items.some(isNonEmptyListItem);
      if (hasItems) {
        listBlockCount += 1;
        const listType = block?.listType || 'unknown';
        listTypes[listType] = (listTypes[listType] || 0) + 1;
      }
    }
  });

  return {
    totalBlocks: blocks.length,
    blockCounts,
    listBlockCount,
    listTypes
  };
};

const sanitizeListMentions = (text, draftSummary) => {
  const raw = String(text || '');
  if (!draftSummary || draftSummary.listBlockCount > 0) return raw;
  if (!/(\buls?\b|\blists?\b|\bbullets?\b|\bul\b|\bol\b)/i.test(raw)) {
    return raw;
  }
  return `${raw}\n\nNote: No list blocks were detected in the current draft.`;
};

const sanitizeSuggestions = (suggestions, draftSummary) => {
  const list = Array.isArray(suggestions) ? suggestions : [];
  if (!draftSummary || draftSummary.listBlockCount > 0) return list;
  const filtered = list.filter(item => !/(\buls?\b|\blists?\b|\bbullets?\b|\bul\b|\bol\b)/i.test(String(item || '')));
  if (filtered.length === list.length) return list;
  filtered.unshift('No lists detected in the current draft.');
  return filtered;
};

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/drafts', async (req, res) => {
  try {
    const drafts = await readDrafts();
    res.json(drafts);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load drafts' });
  }
});

app.get('/drafts/:id', async (req, res) => {
  try {
    const drafts = await readDrafts();
    const draft = drafts.find(d => d.id === req.params.id);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    res.json(draft);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load draft' });
  }
});

app.put('/drafts/:id', async (req, res) => {
  try {
    const payload = req.body || {};
    const drafts = await readDrafts();
    const index = drafts.findIndex(d => d.id === req.params.id);
    const data = {
      id: req.params.id,
      name: payload.name || payload.title || 'Untitled Draft',
      title: payload.title || payload.name || '',
      blocks: Array.isArray(payload.blocks) ? payload.blocks : [],
      timestamp: payload.timestamp || Date.now(),
      updatedAt: payload.updatedAt || Date.now()
    };

    if (index === -1) {
      drafts.unshift(data);
    } else {
      drafts[index] = { ...drafts[index], ...data };
    }

    await writeDrafts(drafts);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

app.delete('/drafts/:id', async (req, res) => {
  try {
    const drafts = await readDrafts();
    const filtered = drafts.filter(d => d.id !== req.params.id);
    await writeDrafts(filtered);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

app.post('/ai/suggest', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not set' });
    }

    if (typeof fetch !== 'function') {
      return res.status(500).json({ error: 'Fetch is not available. Upgrade Node.js to 18+.' });
    }

    const { prompt, draft, language, requireEdits, selection } = req.body || {};
    if (!prompt || !draft || !Array.isArray(draft.blocks)) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const system = `You are an AI writing assistant for a structured blog editor.\n` +
      `Return JSON only with keys: suggestions (array of strings) and draft (full draft object).\n` +
      `You may restructure blocks and change block types/variants when appropriate, but ONLY using the allowed palette types:\n` +
      `- header (levels 1-4; presets: default, red, blue)\n` +
      `- paragraph (variants: normal, small, small-gray)\n` +
      `- list (listType: ul, ol, ol-title, dl)\n` +
      `- card (subtype: 2-col, 3-col; cards array with title/content/image/alt)\n` +
      `Preserve block ids when possible; if you add new blocks, generate new ids as "block-<unique>".\n` +
      `You MUST actively use palette components to improve structure and readability:\n` +
      `- Convert flat paragraphs into headers + paragraphs where there are clear section breaks.\n` +
      `- Convert enumerations into lists; use dl for key/value pairs.\n` +
      `- When there are 2-3 related highlights, summarize as a card block (2-col or 3-col).\n` +
      `- Use small or small-gray for disclaimers, notes, or captions.\n` +
      `Prefer improving structure over minor wording tweaks.\n` +
      `When you bold text, use **double asterisks** around the exact words.\n` +
      `When the user asks to make text blue or red inside paragraphs/lists/cards, wrap only the words to color as {blue}...{/blue} or {red}...{/red} (do not add CSS).\n` +
      `For headers, never use {blue}/{red} markers in content. Use the header preset field: preset: "blue" or preset: "red".\n` +
      `Avoid raw HTML tags (including <strong>) and do not introduce any new HTML elements, inline styles, or CSS.\n` +
      `For card blocks, NEVER change existing image URLs or alt text. When adding new cards, set image to an empty string.\n` +
      `Do not add any custom fields or attributes beyond the allowed block schema.\n` +
      `IMPORTANT: Suggestions must describe planned changes, not completed edits. Use future/conditional phrasing like "I will change... after you apply" and never claim edits are already done before apply.\n` +
      `${selection ? 'Selection is provided. If selection.scope is "subtree", you must reconstruct and return the full subtree under the selected header (that header and all child blocks until the next header of same or higher level). Keep all other blocks and the title unchanged. Preserve existing block ids when possible and include any new blocks needed. If you add new blocks outside subtree replacement, include top-level field selectionInsert with value "before" or "after" to place new blocks relative to the selected block. When you add a new block, suggestions must include the exact text you will insert.\n' : ''}` +
      `${requireEdits ? 'You MUST return a draft that differs from the input with at least one meaningful change. Do not return the original draft unchanged.\n' : ''}` +
      `You will receive draftSummary with counts. When describing structure, use draftSummary counts exactly.\n` +
      `If draftSummary.listBlockCount is 0, you must say there are no lists/bullets.\n` +
      `Do not invent unsupported block types.\n` +
      `If no edits needed, return the original draft unchanged and provide suggestions.\n` +
      `Language for suggestions: ${language || 'en'}.`;

    const draftSummary = summarizeDraft(draft);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify({ prompt, draftSummary, selection, draft }) }
        ],
        text: {
          format: { type: 'json_object' }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI request failed:', errText);
      return res.status(500).json({ error: 'AI request failed', details: errText });
    }

    const data = await response.json();
    const outputText = data.output_text
      || data.output?.[0]?.content?.[0]?.text
      || '';

    const parsed = outputText ? JSON.parse(outputText) : null;
    if (!parsed || !parsed.draft) {
      return res.status(500).json({ error: 'Invalid AI response' });
    }

    const normalizeDraftTextFields = (draft) => {
      if (!draft || !Array.isArray(draft.blocks)) return draft;
      const pickText = (...values) => {
        for (const value of values) {
          if (value === null || value === undefined) continue;
          if (typeof value === 'string' && value.trim() === '') continue;
          return value;
        }
        return '';
      };

      const blocks = draft.blocks.map(block => {
        if (!block || typeof block !== 'object') return block;
        const data = block.data && typeof block.data === 'object' ? block.data : {};
        if (block.type === 'header') {
          const content = pickText(block.content, block.text, data.text, data.content, data.title);
          return { ...block, content };
        }
        if (block.type === 'paragraph') {
          const content = pickText(block.content, block.text, data.text, data.content);
          return { ...block, content };
        }
        if (block.type === 'list' && Array.isArray(block.items)) {
          return {
            ...block,
            items: block.items.map(item => {
              if (!item || typeof item !== 'object') return { content: String(item ?? '') };
              const content = pickText(item.content, item.text, item.value, item.title, item.label, item.name);
              let term = pickText(item.term, item.key, item.title, item.label);
              let definition = pickText(item.definition, item.value, item.content, item.text);
              if (block.listType === 'dl') {
                if ((!term || !definition) && typeof content === 'string' && content.includes('：')) {
                  const [left, ...rest] = content.split('：');
                  if (!term) term = left?.trim() || '';
                  if (!definition) definition = rest.join('：').trim() || '';
                } else if ((!term || !definition) && typeof content === 'string' && content.includes(':')) {
                  const [left, ...rest] = content.split(':');
                  if (!term) term = left?.trim() || '';
                  if (!definition) definition = rest.join(':').trim() || '';
                }
                if (!term && content) term = String(content);
                if (!definition && content && term && content !== term) definition = String(content);
                return { term, definition };
              }
              if (block.listType === 'ol-title') {
                return { title: term, content: definition || content };
              }
              return { content };
            })
          };
        }
        return block;
      });

      return { ...draft, blocks };
    };

    parsed.draft = normalizeDraftTextFields(parsed.draft);

    if (selection && parsed.draft && Array.isArray(parsed.draft.blocks) && Array.isArray(draft.blocks)) {
      const hasSelectionInsert = typeof parsed.draft.selectionInsert === 'string' || typeof parsed.draft.insertPosition === 'string' || typeof parsed.draft._selectionInsert === 'string';
      if (!hasSelectionInsert && selection.scope !== 'subtree') {
        const originalIds = new Set(draft.blocks.map(block => block && block.id).filter(Boolean));
        const newBlocks = parsed.draft.blocks.filter(block => block && block.id && !originalIds.has(block.id));
        if (newBlocks.length) {
          const promptText = String(prompt || '').toLowerCase();
          let inferred = 'after';
          if (/\b(before|above|prior|previous|upward)\b/.test(promptText)) {
            inferred = 'before';
          } else if (/\b(after|below|under|beneath|downward)\b/.test(promptText)) {
            inferred = 'after';
          }
          parsed.draft.selectionInsert = inferred;
        }
      }
    }

    res.json({
      suggestions: sanitizeSuggestions(Array.isArray(parsed.suggestions) ? parsed.suggestions : [], draftSummary),
      draft: parsed.draft
    });
  } catch (e) {
    console.error('AI request error:', e);
    res.status(500).json({ error: 'AI request error', details: String(e?.message || e) });
  }
});

app.post('/ai/chat', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not set' });
    }

    if (typeof fetch !== 'function') {
      return res.status(500).json({ error: 'Fetch is not available. Upgrade Node.js to 18+.' });
    }

    const { message, history, draft, language } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const system = `You are an AI assistant for a blog editor.\n` +
      `Answer questions about the draft and suggest improvements.\n` +
      `Be concise and actionable.\n` +
      `You will receive draftSummary with counts. When describing structure, use draftSummary counts exactly.\n` +
      `If draftSummary.listBlockCount is 0, you must say there are no lists/bullets.\n` +
      `Language: ${language || 'en'}.`;

    const chatHistory = Array.isArray(history) ? history.slice(-10) : [];
    const draftSummary = summarizeDraft(draft);
    const userContent = JSON.stringify({ message, draftSummary, draft });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: system },
          ...chatHistory,
          { role: 'user', content: userContent }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI chat failed:', errText);
      return res.status(500).json({ error: 'AI chat failed', details: errText });
    }

    const data = await response.json();
    const outputText = data.output_text
      || data.output?.[0]?.content?.[0]?.text
      || '';

    res.json({ message: sanitizeListMentions(outputText, draftSummary) });
  } catch (e) {
    console.error('AI chat error:', e);
    res.status(500).json({ error: 'AI chat error', details: String(e?.message || e) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Draft server listening on port ${PORT}`);
});