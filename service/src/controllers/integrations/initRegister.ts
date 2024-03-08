import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import knex from '@data';
import { redisClient } from '@lib/redisClient';
import {
  HTTPError,
  RegisterInitServiceInput,
  RegisterInitServiceOutput,
} from 'authservice-shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validate(body: any): body is RegisterInitServiceInput {
  if (typeof body['email'] !== 'string') return false;
  return true;
}

export async function initRegister(
  req: Request,
  res: Response<HTTPError | RegisterInitServiceOutput>
) {
  try {
    if (!req.integration) {
      return res.status(401).json({ error: 'Missing authentication' });
    }
    if (!validate(req.body)) {
      return res.status(400).json({ error: 'Bad Body' });
    }
    const { email } = req.body;
    const id = await knex('users').insert({
      integrationId: req.integration.id,
      email,
      cardId: 'pending',
    });
    const SVCRegisterToken = uuid();
    await redisClient.set(SVCRegisterToken, String(id), 10 * 60);
    return res.status(201).json({ SVCRegisterToken });
  } catch (error) {
    console.log('Error: ', error);
    res.status(500).json({ error: 'Unexpected error' });
  }
}
