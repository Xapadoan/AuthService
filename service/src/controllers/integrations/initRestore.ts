import knex from '@data';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  HTTPError,
  RestoreInitServiceInput,
  RestoreInitServiceOutput,
} from '@authservice/shared';
import { redisClient } from '@lib/redisClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validate(body: any): body is RestoreInitServiceInput {
  if (typeof body['email'] !== 'string') return false;
  return true;
}

export async function initRestore(
  req: Request,
  res: Response<HTTPError | RestoreInitServiceOutput>
) {
  try {
    if (!req.integration) {
      return res.status(401).json({ error: 'Missing Authentication' });
    }
    if (!validate(req.body)) {
      return res.status(400).json({ error: 'Bad Body' });
    }
    const { email } = req.body;
    const user = await knex('users')
      .select('*')
      .where({ email, integrationId: req.integration.id })
      .first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const SVCRestoreToken = uuid();
    await redisClient.set(`restore:${SVCRestoreToken}`, user.id, 600);
    return res.json({ SVCRestoreToken });
  } catch (error) {
    console.error('Restore init failed: ', error);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
