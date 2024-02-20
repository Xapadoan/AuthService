import { config } from 'dotenv';
config();

export default function globalSetup() {
  console.log('Global setup OK');
}
