import { config } from 'dotenv';
config();
import express from 'express';
import { initDb } from './data';

process.once('SIGINT', () => process.kill(process.pid, 'SIGINT'));
process.once('SIGUSR2', () => process.kill(process.pid, 'SIGUSR2'));

const port = process.env.PORT;

async function initServer() {
  await initDb();
  const app = express();
  app.use(express.json({ type: 'application/json' }));
  app.listen(port, () => console.log('AuthService Ready on port ', port));
}

initServer();
