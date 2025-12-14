import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 8787;

app.listen(port, () => {
  console.log(`MathFlow backend listening on http://localhost:${port}`);
});
