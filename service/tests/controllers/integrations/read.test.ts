import request from 'supertest';
import express, { Request, NextFunction } from 'express';
import '@lib/http';
import { read } from '@controllers/integrations/read';
import { validIntegration } from '../../utils';

const mockAuthMiddleware = jest.fn((req: Request, _res, next: NextFunction) => {
  req.integration = validIntegration;
  return next();
});

describe('Integration Read Controller', () => {
  const app = express();
  beforeAll(() => {
    app.use('/', mockAuthMiddleware);
    app.use(express.json({ type: 'application/json' }));
    app.get('/', read);
  });
  afterAll(() => {
    jest.resetAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authMiddleware did not set integration', async () => {
    mockAuthMiddleware.mockImplementationOnce((_res, _req, next) => next());
    const response = await request(app).get('/');
    expect(response.unauthorized);
  });

  it('should return integration if authMiddleware set integration', async () => {
    const response = await request(app).get('/');
    expect(response.accepted);
    expect(response.body).toMatchObject(validIntegration);
  });

  it('should return 500 if anything throws', async () => {
    mockAuthMiddleware.mockImplementationOnce(
      (req: Request, _res, next: NextFunction) => {
        req.integration = {
          ...validIntegration,
          id: BigInt(42) as unknown as number,
        };
        return next();
      }
    );
    const response = await request(app).get('/');
    expect(response.serverError);
  });
});
