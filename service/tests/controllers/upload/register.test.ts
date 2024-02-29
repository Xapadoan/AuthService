const mockSet = jest.fn();
jest.mock('@lib/redisClient', () => ({ redisClient: { set: mockSet } }));
const mockUuid = jest.fn(() => 'uuid-mocked');
jest.mock('uuid', () => ({ v4: mockUuid }));
const mockInsert = jest.fn().mockResolvedValue(1);
const mockKnex = jest.fn(() => ({ insert: mockInsert }));
jest.mock('knex', () => jest.fn(() => mockKnex));

import { registerUpload } from '@controllers/upload/register';
import express, { NextFunction, Request } from 'express';
import request from 'supertest';
import '@lib/http';

const validIntegration = {
  id: 1,
  apiKey: 'apiKey-1',
  registerWebhook: 'register-1',
  restoreWebhook: 'restore-1',
  resetConfirmationWebhook: 'reset-confirmation-1',
  resetCredentialsWebhook: 'reset-credentials-1',
};

const mockAuthMiddleware = jest.fn((req: Request, _res, next: NextFunction) => {
  req.integration = validIntegration;
  return next();
});

describe('Register Upload Controller', () => {
  const app = express();
  beforeAll(() => {
    app.use(express.json({ type: 'application/json' }));
    app.use('/', mockAuthMiddleware);
    app.post('/', registerUpload);
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authMiddleware did not set integration', async () => {
    mockAuthMiddleware.mockImplementationOnce((_res, _req, next) => next());
    const response = await request(app).post('/');
    expect(response.unauthorized);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should return 400 if body is not correctly set', async () => {
    const responses = await Promise.all([
      request(app).post('/').send(),
      request(app).post('/').send({}),
    ]);
    responses.forEach((response) => {
      expect(response.badRequest);
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should return 500 if anything throws', async () => {
    mockSet.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockInsert.mockImplementationOnce(() => {
      throw new Error('Intentional insert error');
    });
    const responses = await Promise.all([
      request(app).post('/').send({ email: 'an email' }),
      request(app).post('/').send({ email: 'an email' }),
    ]);
    responses.forEach((response) => {
      expect(response.serverError);
    });
  });
});
