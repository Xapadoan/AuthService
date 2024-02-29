import {
  HTTPError,
  RegisterUploadServiceInput,
  RegisterUploadServiceOutput,
  handleResponse,
} from 'shared';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { redisClient } from '@lib/redisClient';
import knex from '@data';
import { detectCardId } from '@lib/detectCardId';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validate(body: any): body is RegisterUploadServiceInput {
  if (typeof body['base64Image'] !== 'string') return false;
  if (typeof body['SVCRegisterToken'] !== 'string') return false;
  if (typeof body['EACRegisterToken'] !== 'string') return false;
  return true;
}

export async function registerUpload(
  req: Request,
  res: Response<HTTPError | RegisterUploadServiceOutput>
) {
  try {
    if (!validate(req.body)) {
      return res.status(400).json({ error: 'Bad Body' });
    }
    const { EACRegisterToken, SVCRegisterToken, base64Image } = req.body;
    const userId = await redisClient.get(SVCRegisterToken);
    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = await knex('users')
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
    await knex('users')
      .update({ cardId: String(cardIdDetection.id) })
      .where({ id: userId });
    const apiKey = uuid();
    await fetch(user.registerWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        EACRegisterToken,
      }),
    }).then(handleResponse);
    await redisClient.del(SVCRegisterToken);
    return res.json({ success: true });
  } catch (error) {
    console.log('Register upload failed: ', error);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
