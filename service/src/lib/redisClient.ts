import { RedisClient } from 'shared';

export const redisClient = new RedisClient({ prefix: 'authservice-service' });
