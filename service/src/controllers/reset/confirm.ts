import { Request, Response } from 'express';
import {
  HTTPError,
  Integration,
  ResetConfirmServerOutput,
  ResetConfirmServiceInput,
  handleResponse,
} from '@authservice/shared';
import { redisClient } from '@lib/redisClient';
import { User } from '@lib/types';
import knex from '@data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validate(query: any): query is ResetConfirmServiceInput {
  if (typeof query['SVCResetToken'] !== 'string') return false;
  if (query['SVCResetToken'].length < 1) return false;
  return true;
}

export async function confirm(req: Request, res: Response<HTTPError>) {
  try {
    if (!validate(req.query)) {
      return res.status(400).json({ error: 'Bad Body' });
    }
    const { SVCResetToken } = req.query;
    const userId = await redisClient.get(`reset:${SVCResetToken}`);
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
    const { EACResetToken } = await fetch(user.resetConfirmationWebhook, {
      method: 'POST',
    }).then((res) => handleResponse<ResetConfirmServerOutput>(res));
    await redisClient.set(`reset:${userId}`, EACResetToken, 60 * 10);
    return res.redirect(
      307,
      `${user.resetUploadPage}?SVCResetToken=${SVCResetToken}`
    );
  } catch (error) {
    console.error('Reset card id confirmation failed: ', error);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
