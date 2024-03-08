import {
  validUserJoinIntegration,
  expectResolved,
  expectNthResolved,
} from '../../utils';
const mockGet = jest
  .fn()
  .mockResolvedValue(String(validUserJoinIntegration.id));
jest.mock('@lib/redisClient', () => ({
  redisClient: { get: mockGet },
}));
const mockUuid = jest.fn(() => 'uuid-mocked');
jest.mock('uuid', () => ({ v4: mockUuid }));
const mockInnerJoin = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();
const mockWhere = jest.fn();
const mockFirst = jest.fn().mockResolvedValue(validUserJoinIntegration);
const mockKnex = jest.fn(() => ({
  innerJoin: mockInnerJoin,
  select: jest.fn().mockReturnThis(),
  update: mockUpdate,
  where: mockWhere.mockReturnThis(),
  first: mockFirst,
}));
jest.mock('knex', () => jest.fn(() => mockKnex));
const mockDetectCardId = jest
  .fn()
  .mockResolvedValue({ success: true, id: validUserJoinIntegration.cardId });
jest.mock('@lib/detectCardId', () => ({ detectCardId: mockDetectCardId }));
const mockFetchJson = jest.fn();
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: mockFetchJson,
});
global.fetch = mockFetch;

import { resetUpload } from '@controllers/upload/reset';
import express from 'express';
import request from 'supertest';
import '@lib/http';

const validPayload = {
  base64Image: 'base64Image',
  SVCResetToken: 'SVCResetToken',
};

describe('Restore Upload Controller', () => {
  const app = express();
  beforeAll(() => {
    app.use(express.json({ type: 'application/json' }));
    app.post('/', resetUpload);
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if body is not correctly set', async () => {
    const responses = await Promise.all([
      request(app).post('/').send(),
      request(app).post('/').send({}),
      request(app).post('/').send({ base64Image: validPayload.base64Image }),
      request(app)
        .post('/')
        .send({ SVCResetToken: validPayload.SVCResetToken }),
      request(app).post('/').send({
        base64Image: 123,
        SVCRestoreToken: validPayload.SVCResetToken,
      }),
      request(app).post('/').send({
        base64Image: validPayload.base64Image,
        SVCRestoreToken: 123,
      }),
    ]);
    responses.forEach((response) => {
      expect(response.badRequest);
    });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should return 404 when SVCResetToken not found', async () => {
    mockGet.mockResolvedValueOnce(null);
    const response = await request(app).post('/').send(validPayload);
    expect(mockGet).toHaveBeenCalledWith(
      `reset:${validPayload.SVCResetToken}`
    );
    expectResolved(mockGet).toBeNull();
    expect(response.notFound);
  });

  it('should return 404 when EACResetToken not found', async () => {
    mockGet.mockResolvedValueOnce(String(validUserJoinIntegration.id));
    mockGet.mockResolvedValueOnce(null);
    const response = await request(app).post('/').send(validPayload);
    expect(mockGet).toHaveBeenCalledWith(
      `reset:${validPayload.SVCResetToken}`
    );
    expectNthResolved(mockGet, 1).toEqual(String(validUserJoinIntegration.id));
    expect(mockGet).toHaveBeenCalledWith(
      `reset:${validUserJoinIntegration.id}`
    );
    expectNthResolved(mockGet, 2).toBeNull();
    expect(response.notFound);
  });

  it('should return 404 when user not found', async () => {
    mockGet.mockResolvedValueOnce(String(validUserJoinIntegration.id));
    mockGet.mockResolvedValueOnce('EACResetToken');
    mockFirst.mockResolvedValueOnce(undefined);
    const response = await request(app).post('/').send(validPayload);
    expect(mockGet).toHaveBeenCalledWith(
      `reset:${validPayload.SVCResetToken}`
    );
    expectNthResolved(mockGet, 1).toEqual(String(validUserJoinIntegration.id));
    expect(mockGet).toHaveBeenCalledWith(
      `reset:${validUserJoinIntegration.id}`
    );
    expectNthResolved(mockGet, 2).toEqual('EACResetToken');
    expect(mockKnex).toHaveBeenCalledWith('users');
    expect(mockInnerJoin).toHaveBeenCalledWith(
      'integrations',
      'users.integrationId',
      'integrations.id'
    );
    expect(mockWhere).toHaveBeenCalledWith({
      'users.id': String(validUserJoinIntegration.id),
    });
    expectResolved(mockFirst).toBeUndefined();
    expect(response.notFound);
  });

  it('should return 422 when text detection fails', async () => {
    mockDetectCardId.mockResolvedValueOnce({ success: false });
    const response = await request(app).post('/').send(validPayload);
    expectResolved(mockFirst).toEqual(validUserJoinIntegration);
    expect(mockDetectCardId).toHaveBeenCalledWith(validPayload.base64Image);
    expectResolved(mockDetectCardId).toMatchObject({ success: false });
    expect(response.notAcceptable);
  });

  test('best case scenario', async () => {
    const response = await request(app).post('/').send(validPayload);
    expect(response.ok);
  });

  it('should return 500 if anything throws', async () => {
    mockGet.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockGet.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockKnex.mockImplementationOnce(() => {
      throw new Error('Intentional insert error');
    });
    mockDetectCardId.mockImplementationOnce(() => {
      throw new Error('Intentional detection error');
    });
    mockKnex.mockImplementationOnce(() => {
      throw new Error('Intentional insert error');
    });
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Intentional fetch error');
    });
    mockFetchJson.mockImplementationOnce(() => {
      throw new Error('Intentional JSON parse error');
    });
    const responses = await Promise.all([
      request(app).post('/').send(validPayload),
      request(app).post('/').send(validPayload),
      request(app).post('/').send(validPayload),
      request(app).post('/').send(validPayload),
      request(app).post('/').send(validPayload),
      request(app).post('/').send(validPayload),
      request(app).post('/').send(validPayload),
    ]);
    responses.forEach((response) => {
      expect(response.serverError);
    });
  });
});
