import { validIntegration, expectResolved, validUser } from '../../utils';
const mockSet = jest.fn();
jest.mock('@lib/redisClient', () => ({ redisClient: { set: mockSet } }));
const mockUuid = jest.fn(() => 'uuid-mocked');
jest.mock('uuid', () => ({ v4: mockUuid }));
const mockSelect = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();
const mockFirst = jest.fn().mockResolvedValue(undefined);
const mockInsert = jest.fn().mockResolvedValue([1]);
const mockKnex = jest.fn(() => ({
  select: mockSelect,
  where: mockWhere,
  first: mockFirst,
  insert: mockInsert,
}));
jest.mock('knex', () => jest.fn(() => mockKnex));

import { initRegister } from '@controllers/integrations/initRegister';
import express, { NextFunction, Request } from 'express';
import request from 'supertest';
import '@lib/http';

const mockAuthMiddleware = jest.fn((req: Request, _res, next: NextFunction) => {
  req.integration = validIntegration;
  return next();
});

describe('Register Init Controller', () => {
  const app = express();
  beforeAll(() => {
    app.use(express.json({ type: 'application/json' }));
    app.use('/', mockAuthMiddleware);
    app.post('/', initRegister);
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
      request(app).post('/').send({ notemail: 'asd' }),
      request(app).post('/').send({ email: 123 }),
    ]);
    responses.forEach((response) => {
      expect(response.badRequest);
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should return 409 if user already exists for this integration', async () => {
    mockFirst.mockResolvedValueOnce(validUser);
    const response = await request(app)
      .post('/')
      .send({ email: validUser.email });
    expect(mockAuthMiddleware).toHaveBeenCalled();
    expect(mockKnex).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalledWith({
      email: validUser.email,
      integrationId: validIntegration.id,
    });
    expectResolved(mockFirst).toMatchObject(validUser);
    expect(response.statusCode).toEqual(409);
  });

  it('should return 500 if anything throws', async () => {
    mockSet.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockInsert.mockImplementationOnce(() => {
      throw new Error('Intentional insert error');
    });
    mockSelect.mockImplementationOnce(() => {
      throw new Error('Intentional select error');
    });
    const responses = await Promise.all([
      request(app).post('/').send({ email: 'an email' }),
      request(app).post('/').send({ email: 'an email' }),
      request(app).post('/').send({ email: 'an email' }),
    ]);
    responses.forEach((response) => {
      expect(response.serverError);
    });
  });

  test('best case scenario', async () => {
    const response = await request(app)
      .post('/')
      .send({ email: validUser.email });
    expect(mockAuthMiddleware).toHaveBeenCalled();
    expect(mockKnex).toHaveBeenCalledTimes(2);
    expect(mockKnex).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalledWith({
      email: validUser.email,
      integrationId: validIntegration.id,
    });
    expectResolved(mockFirst).toBeUndefined();
    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith({
      integrationId: validIntegration.id,
      email: validUser.email,
      cardId: 'pending',
    });
    expectResolved(mockInsert).toEqual([1]);
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('uuid-mocked');
    expect(mockSet).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith('register:uuid-mocked', '1', 600);
    expect(response.status).toEqual(201);
    expect(response.body).toMatchObject({ SVCRegisterToken: 'uuid-mocked' });
  });
});
