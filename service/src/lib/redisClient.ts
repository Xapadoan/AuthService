import { createClient } from 'redis';

const client = createClient();
const prefix = 'authservice-main:';

export function get(key: string) {
  return client.get(`${prefix}:${key}`);
}

export function set(key: string, value: string, EX?: number) {
  return client.set(`${prefix}:${key}`, value, { EX });
}
