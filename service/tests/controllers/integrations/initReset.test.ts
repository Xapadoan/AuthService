import { validUser, validIntegration, expectResolved } from '../../utils';
const mockSet = jest.fn();
jest.mock('@lib/redisClient', () => ({ redisClient: { set: mockSet } }));
const mockUuid = jest.fn(() => 'uuid-mocked');
jest.mock('uuid', () => ({ v4: mockUuid }));
const mockWhere = jest.fn().mockReturnThis();
const mockFirst = jest.fn().mockResolvedValue(validUser);
const mockKnex = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  where: mockWhere,
  first: mockFirst,
}));
jest.mock('knex', () => jest.fn(() => mockKnex));

import { initReset } from '@controllers/integrations/initReset';
import express, { NextFunction, Request } from 'express';
import request from 'supertest';
import '@lib/http';

const mockAuthMiddleware = jest.fn((req: Request, _res, next: NextFunction) => {
  req.integration = validIntegration;
  return next();
});

describe('Restore Init Controller', () => {
  const app = express();
  beforeAll(() => {
    app.use(express.json({ type: 'application/json' }));
    app.use('/', mockAuthMiddleware);
    app.post('/', initReset);
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
    expect(mockKnex).not.toHaveBeenCalled();
  });

  it('should return 400 if body is not correctly set', async () => {
    const responses = await Promise.all([
      request(app).post('/').send(),
      request(app).post('/').send({}),
      request(app).post('/').send({ notemail: 'asd' }),
      request(app).post('/').send({ email: 123 }),
    ]);
    responses.forEach((response) => {
      expect(response.badRequest);
    });
    expect(mockKnex).not.toHaveBeenCalled();
  });

  it('should return 404 if user does not exist', async () => {
    mockFirst.mockResolvedValueOnce(undefined);
    const response = await request(app)
      .post('/')
      .send({ email: validUser.email });
    expect(mockKnex).toHaveBeenCalledWith('users');
    expect(mockWhere).toHaveBeenCalledWith({
      email: validUser.email,
      integrationId: validIntegration.id,
    });
    expectResolved(mockFirst).toBeUndefined();
    expect(response.notFound);
  });

  it('should do many stuff when ok', async () => {
    const response = await request(app).post('/').send({ email: 'an email' });
    expect(mockAuthMiddleware).toHaveBeenCalled();
    expect(mockKnex).toHaveBeenCalled();
    expect(mockKnex).toHaveBeenCalledWith('users');
    expect(mockWhere).toHaveBeenCalledWith({
      integrationId: validIntegration.id,
      email: 'an email',
    });
    expectResolved(mockFirst).toMatchObject(validUser);
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('uuid-mocked');
    expect(mockSet).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      'reset:uuid-mocked',
      String(validUser.id),
      600
    );
    expect(response.ok);
    expect(response.body).toMatchObject({ success: true });
  });

  it('should return 500 if anything throws', async () => {
    mockSet.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockWhere.mockImplementationOnce(() => {
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
