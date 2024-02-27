import { config } from 'dotenv';
config();
import express from 'express';
import { redisClient } from '@lib/redisClient';
import { initDb } from './data';
import router from './controllers';

const port = process.env.PORT;

async function initServer() {
  await initDb();
  const app = express();
  app.use(express.json({ type: 'application/json' }));
  app.use(router);
  app.listen(port, () => console.log('AuthService Ready on port ', port));
}

function stopServer(signal: NodeJS.Signals) {
  console.log(`Captured ${signal}, Closing Gracefully...`);
  redisClient.close().finally(() => {
    process.kill(process.pid, signal);
  });
}

process.once('SIGINT', () => stopServer('SIGINT'));
process.once('SIGUSR2', () => stopServer('SIGUSR2'));

initServer();
