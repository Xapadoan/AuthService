import { Request, Response } from 'express';
import { Failable, HTTPError, ResetInitServiceInput } from 'authservice-shared';
import { v4 as uuid } from 'uuid';
import knex from '@data';
import { User } from '@lib/types';
import { redisClient } from '@lib/redisClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validate(body: any): body is ResetInitServiceInput {
  if (typeof body['email'] !== 'string') return false;
  return true;
}

export async function initReset(
  req: Request,
  res: Response<HTTPError | Failable>
) {
  try {
    console.log('RESET');
    if (!req.integration) {
      return res.status(401).json({ error: 'Missing Authentication' });
    }
    console.log('integration OK');
    if (!validate(req.body)) {
      return res.status(400).json({ error: 'Bad Body' });
    }
    console.log('Body OK');
    const { email } = req.body;
    const user: User = await knex('users')
      .select('*')
      .where({ email, integrationId: req.integration.id })
      .first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const SVCResetInitToken = uuid();
    await redisClient.set(`reset:${SVCResetInitToken}`, String(user.id), 600);
    // await redisClient.set(`reset:${user.id}`, EACResetToken);
    // Send mail now
    return res.json({ success: true });
  } catch (error) {
    console.error('Reset card init failed: ', error);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
