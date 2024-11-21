import express from 'express';
import cors from 'cors';
import { createServer } from 'vite';
import axios from 'axios';

const app = express();
app.use(cors());

// Proxy endpoint for RSS feed
app.get('/api/feed', async (req, res) => {
  try {
    const response = await axios.get(req.query.url);
    res.send(response.data);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch RSS feed' });
  }
});

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

app.use(vite.middlewares);

const port = 5173;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});