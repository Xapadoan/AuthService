import { redisClient } from '@lib/redisClient';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import knex from '@data';
import { User } from '@lib/types';
import { detectCardId } from '@lib/detectCardId';
import {
  Failable,
  HTTPError,
  Integration,
  RestoreUploadServiceInput,
  handleResponse,
} from '@authservice/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validate(body: any): body is RestoreUploadServiceInput {
  if (typeof body['base64Image'] !== 'string') return false;
  if (typeof body['SVCRestoreToken'] !== 'string') return false;
  if (typeof body['EACRestoreToken'] !== 'string') return false;
  return true;
}

export async function restoreUpload(
  req: Request,
  res: Response<HTTPError | Failable>
) {
  try {
    if (!validate(req.body)) {
      return res.status(400).json({ error: 'Bad Body' });
    }
    const { SVCRestoreToken, EACRestoreToken, base64Image } = req.body;
    const userId = await redisClient.get(`restore:${SVCRestoreToken}`);
    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user: User & Integration = await knex('users')
      .innerJoin('integrations', 'users.integrationId', 'integrations.id')
      .select('*')
      .where({ 'users.id': userId })
      .first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const cardIdDetection = await detectCardId(base64Image);
    if (!cardIdDetection.success) {
      return res.status(422).json({ error: cardIdDetection.error });
    }
    if (user.cardId !== cardIdDetection.id) {
      return res.status(403).json({ error: 'Wrong card' });
    }
    const sessionId = uuid();
    await fetch(user.restoreWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        EACRestoreToken,
        sessionId,
      }),
    }).then(handleResponse);
    await redisClient.del(`restore:${SVCRestoreToken}`);
    return res.json({ success: true });
  } catch (error) {
    console.log('Restore upload failed: ', error);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
