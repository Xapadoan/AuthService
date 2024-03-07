import { Request, Response } from 'express';
import { Failable, HTTPError, ResetInitServiceInput } from 'authservice-shared';
import { v4 as uuid } from 'uuid';
import { createTransport } from 'nodemailer';
import knex from '@data';
import { User } from '@lib/types';
import { redisClient } from '@lib/redisClient';

const { HOST, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validate(body: any): body is ResetInitServiceInput {
  if (typeof body['email'] !== 'string') return false;
  return true;
}

async function sendConfirmationEmail({
  email,
  resetLink,
}: {
  email: string;
  resetLink: string;
}) {
  const transport = createTransport({
    host: String(SMTP_HOST),
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transport.sendMail({
    from: '"Auth Service" <reset@authservice.dev>',
    to: email,
    subject: 'Reset your identity card',
    text: 'Hello World !',
    html: `
      <h1>Reset your cardId</h1>
      <p>Click 
      <a href=${resetLink}>here</a>
       to confirm and start the reset process. If the link doesn't work copy paste
       the following in a new tab:<br/>
      ${resetLink}
      </p>
    `,
  });
}

export async function initReset(
  req: Request,
  res: Response<HTTPError | Failable>
) {
  try {
    if (!req.integration) {
      return res.status(401).json({ error: 'Missing Authentication' });
    }
    if (!validate(req.body)) {
      return res.status(400).json({ error: 'Bad Body' });
    }
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
    await sendConfirmationEmail({
      email,
      resetLink: `${HOST}/reset/confirm?SVCResetInitToken=${SVCResetInitToken}`,
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('Reset card init failed: ', error);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
