import { RedisClient } from 'authservice-shared';

export const redisClient = new RedisClient({ prefix: 'authservice-service' });
