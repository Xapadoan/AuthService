import {
  expectResolved,
  validUser,
  validUserJoinIntegration,
} from '../../utils';

const mockSet = jest.fn();
const mockGet = jest.fn().mockResolvedValue(String(validUser.id));
jest.mock('@lib/redisClient', () => ({
  redisClient: { set: mockSet, get: mockGet },
}));
const mockInnerJoin = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();
const mockFirst = jest.fn().mockResolvedValue(validUserJoinIntegration);
const mockKnex = jest.fn(() => ({
  innerJoin: mockInnerJoin,
  select: jest.fn().mockReturnThis(),
  where: mockWhere,
  first: mockFirst,
}));
jest.mock('knex', () => jest.fn(() => mockKnex));
const mockFetchJson = jest.fn();
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: mockFetchJson,
});
global.fetch = mockFetch;

import express from 'express';
import request from 'supertest';
import { confirm } from '@controllers/reset/confirm';

describe('Reset Confirm Controller', () => {
  const app = express();
  beforeAll(() => {
    app.use(express.json({ type: 'application/json' }));
    app.get('/', confirm);
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if query is not correctly set', async () => {
    const responses = await Promise.all([
      request(app).get('/'),
      request(app).get('/?notSVCResetInitToken=asd'),
      request(app).get('/?SVCResetInitToken='),
    ]);
    responses.forEach((response) => {
      expect(response.badRequest);
    });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should return 404 when SVCResetInitToken is not set', async () => {
    mockGet.mockResolvedValueOnce(null);
    const response = await request(app).get('/?SVCResetInitToken=token');
    expect(mockGet).toHaveBeenCalledWith('reset:token');
    expectResolved(mockGet).toBeNull();
    expect(response.notFound);
  });

  it('should return 404 when user does not exists', async () => {
    mockFirst.mockResolvedValueOnce(undefined);
    const response = await request(app).get('/?SVCResetInitToken=token');
    expect(mockGet).toHaveBeenCalledWith('reset:token');
    expectResolved(mockGet).toEqual(String(validUserJoinIntegration.id));
    expect(mockKnex).toHaveBeenCalledWith('users');
    expect(mockInnerJoin).toHaveBeenCalledWith(
      'integrations',
      'users.integrationId',
      'integrations.id'
    );
    expect(mockWhere).toHaveBeenCalledWith({
      'users.id': String(validUser.id),
    });
    expectResolved(mockFirst).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(response.notFound);
  });

  it('should get a token from server and use it for redirection', async () => {
    mockFetchJson.mockResolvedValueOnce({ EACResetToken: 'EACResetToken' });
    const response = await request(app).get('/?SVCResetInitToken=token');
    expect(mockGet).toHaveBeenCalledWith('reset:token');
    expectResolved(mockGet).toEqual(String(validUserJoinIntegration.id));
    expect(mockKnex).toHaveBeenCalledWith('users');
    expect(mockInnerJoin).toHaveBeenCalledWith(
      'integrations',
      'users.integrationId',
      'integrations.id'
    );
    expect(mockWhere).toHaveBeenCalledWith({
      'users.id': String(validUserJoinIntegration.id),
    });
    expectResolved(mockFirst).toMatchObject(validUserJoinIntegration);
    expect(mockFetch).toHaveBeenCalledWith(
      validUserJoinIntegration.resetConfirmationWebhook,
      { method: 'POST' }
    );
    expectResolved(mockFetchJson).toMatchObject({
      EACResetToken: 'EACResetToken',
    });
    expect(mockSet).toHaveBeenCalledWith(
      `reset:${validUserJoinIntegration.id}`,
      'EACResetToken'
    );
    expect(response.redirect);
    expect(response.headers['location']).toEqual(
      `${validUserJoinIntegration.resetUploadPage}?SVCResetInitToken=token`
    );
  });

  it('should return 500 if anything throws', async () => {
    mockGet.mockImplementationOnce(() => {
      throw new Error('Intentional Get error');
    });
    mockKnex.mockImplementationOnce(() => {
      throw new Error('Intentional Knex error');
    });
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Intentional Fetch error');
    });
    mockFetchJson.mockImplementationOnce(() => {
      throw new Error('Intentional JSON parse error');
    });
    mockSet.mockImplementationOnce(() => {
      throw new Error('Intentional Set error');
    });
    const responses = await Promise.all([
      request(app).get('/?SVCResetInitToken=token'),
      request(app).get('/?SVCResetInitToken=token'),
      request(app).get('/?SVCResetInitToken=token'),
      request(app).get('/?SVCResetInitToken=token'),
      request(app).get('/?SVCResetInitToken=token'),
    ]);
    responses.forEach((response) => {
      expect(response.serverError);
    });
  });
});
