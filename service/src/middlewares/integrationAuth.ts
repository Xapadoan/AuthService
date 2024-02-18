import { Request, Response, NextFunction } from 'express';
import knex from '@data';

export async function integrationAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { integrationId } = req.params;
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({ error: 'Missing Authentication' });
    }
    const [strategy, apiKey] = authorization.split(' ');
    if (strategy !== 'Bearer' || !apiKey) {
      return res.status(401).json({ error: 'Missing Authentication' });
    }
    const integration = await knex('integrations')
      .select('*')
      .where({ id: integrationId, apiKey })
      .first();
    if (!integration) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.integration = integration;
    return next();
  } catch (error) {
    console.error('Integration Check Error: ', error);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}
