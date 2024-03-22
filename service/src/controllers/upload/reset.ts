import { Request, Response } from 'express';
import {
  HTTPError,
  Integration,
  ResetUploadServiceInput,
  ResetUploadServiceOutput,
  handleResponse,
} from '@authservice/shared';
import { redisClient } from '@lib/redisClient';
import { User } from '@lib/types';
import knex from '@data';
import { detectCardId } from '@lib/detectCardId';
import { v4 as uuid } from 'uuid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validate(body: any): body is ResetUploadServiceInput {
  if (typeof body['base64Image'] !== 'string') return false;
  if (typeof body['SVCResetToken'] !== 'string') return false;
  return true;
}

export async function resetUpload(
  req: Request,
  res: Response<HTTPError | ResetUploadServiceOutput>
) {
  try {
    if (!validate(req.body)) {
      return res.status(400).json({ error: 'Bad body' });
    }
    const { base64Image, SVCResetToken } = req.body;
    const userId = await redisClient.get(`reset:${SVCResetToken}`);
    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }
    const EACResetToken = await redisClient.get(`reset:${userId}`);
    if (!EACResetToken) {
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
    const cardDetection = await detectCardId(base64Image);
    if (!cardDetection.success) {
      return res.status(422).json({ error: 'Could not detect card id' });
    }
    await knex('users')
      .update({ cardId: cardDetection.id })
      .where({ id: userId });
    const sessionId = uuid();
    await fetch(user.resetCredentialsWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        EACResetToken,
        sessionId,
      }),
    }).then(handleResponse);
    return res.json({ EACResetToken });
  } catch (error) {
    console.error('Reset upload failed: ', error);
    return res.status(500).json({ error: 'Unexpected Server error' });
  }
}
