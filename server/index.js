import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'drafts.json');

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Draft server listening on port ${PORT}`);
});