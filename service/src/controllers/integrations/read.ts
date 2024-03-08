import { Request, Response } from 'express';
import { HTTPError, Integration } from '@authservice/shared';

export async function read(
  req: Request,
  res: Response<HTTPError | Integration>
) {
  try {
    if (!req.integration) {
      return res.status(401).json({ error: 'Missing authentication' });
    }
    return res.json(req.integration);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}
