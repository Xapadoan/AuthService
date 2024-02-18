import { Integration } from '@shared/types';

export type HTTPError = {
  error: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      integration?: Integration;
    }
  }
}
