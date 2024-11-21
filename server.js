import express from 'express';
import cors from 'cors';
import { createServer } from 'vite';
import axios from 'axios';

const app = express();

// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

// Proxy endpoint for RSS feed with error handling
app.get('/api/feed', async (req, res) => {
  try {
    if (!req.query.url) {
      return res.status(400).send({ error: 'URL parameter is required' });
    }

    const response = await axios.get(req.query.url as string, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ForexNewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml;q=0.9, */*;q=0.8'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.status !== 200) {
      throw new Error(`RSS feed returned status code ${response.status}`);
    }

    res.set('Content-Type', 'application/xml');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    res.status(500).send({ 
      error: 'Failed to fetch RSS feed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const vite = await createServer({
  server: { 
    middlewareMode: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  },
  appType: 'spa',
});

app.use(vite.middlewares);

const port = 5173;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});