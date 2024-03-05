import { validIntegration } from '../utils';

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  first: jest.fn().mockResolvedValue(validIntegration),
};

const mockKnex = jest.fn(() => mockQueryBuilder);

jest.mock('knex', () => jest.fn(() => mockKnex));

import express, { Response } from 'express';
import request from 'supertest';
import { integrationAuth } from '@middlewares/integrationAuth';
import { expectResolved } from '../utils';

describe('Integration Auth Middleware', () => {
  const app = express();
  const controllerSpy = jest.fn((_, res: Response) => res.json({ ok: 'OK' }));
  beforeAll(() => {
    app.use(express.json({ type: 'application/json' }));
    app.use('/:integrationId', integrationAuth);
    app.get('/:integrationId', controllerSpy);
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should should return 401 when no authorization header is set', async () => {
    const response = await request(app).get(`/${validIntegration.id}`);
    expect(response.unauthorized);
    expect(controllerSpy).not.toHaveBeenCalled();
  });

  it('should return 401 when auth strategy is not Bearer Token', async () => {
    const response = await request(app)
      .get(`/${validIntegration.id}`)
      .set('Authorization', validIntegration.apiKey);
    expect(response.unauthorized);
    expect(controllerSpy).not.toHaveBeenCalled();
  });

  it('should return 403 when apiKey is wrong', async () => {
    mockQueryBuilder.first.mockResolvedValueOnce(undefined);
    const response = await request(app)
      .get(`/${validIntegration.id}`)
      .set('Authorization', 'Bearer wrong');
    expect(response.forbidden);
    expect(mockKnex).toHaveBeenCalledWith('integrations');
    expect(mockKnex).toHaveReturnedWith(mockQueryBuilder);
    expect(mockQueryBuilder.where).toHaveBeenCalled();
    expect(mockQueryBuilder.where).toHaveBeenCalledWith({
      id: validIntegration.id,
      apiKey: 'wrong',
    });
    expect(mockQueryBuilder.first).toHaveBeenCalled();
    expectResolved(mockQueryBuilder.first).toBeUndefined();
    expect(controllerSpy).not.toHaveBeenCalled();
  });

  it('should return 403 when integrationId is wrong', async () => {
    mockQueryBuilder.first.mockResolvedValueOnce(undefined);
    const response = await request(app)
      .get('/2')
      .set('Authorization', 'Bearer wrong');
    expect(response.forbidden);
    expect(mockKnex).toHaveBeenCalledWith('integrations');
    expect(mockKnex).toHaveReturnedWith(mockQueryBuilder);
    expect(mockQueryBuilder.where).toHaveBeenCalled();
    expect(mockQueryBuilder.where).toHaveBeenCalledWith({
      id: 2,
      apiKey: 'wrong',
    });
    expect(mockQueryBuilder.first).toHaveBeenCalled();
    expectResolved(mockQueryBuilder.first).toBeUndefined();
    expect(controllerSpy).not.toHaveBeenCalled();
  });

  it('should return 500 if anything throws', async () => {
    mockQueryBuilder.select.mockImplementationOnce(() => {
      throw new Error('Intentional select error');
    });
    const response = await request(app)
      .get(`/${validIntegration.id}`)
      .set('Authorization', `Bearer ${validIntegration.id}`);
    expect(mockQueryBuilder.select).toHaveBeenCalled();
    expect(response.status).toEqual(500);
  });

  it('should attach valid integration when successful', async () => {
    await request(app)
      .get(`/${validIntegration.id}`)
      .set('Authorization', `Bearer ${validIntegration.apiKey}`);
    expectResolved(mockQueryBuilder.first).toMatchObject(validIntegration);
    expect(controllerSpy.mock.calls[0][0]['integration']).toMatchObject(
      validIntegration
    );
  });
});
