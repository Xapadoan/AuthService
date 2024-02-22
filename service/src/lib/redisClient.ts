import { RedisClient } from '@shared/lib/RedisClient';

export const redisClient = new RedisClient({ prefix: 'authservice-service' });
