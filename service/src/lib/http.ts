import { Integration } from 'shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      integration?: Integration;
    }
  }
}
