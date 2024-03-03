import {
  validUser,
  expectResolvedValueEqual,
  expectResolvedValueMatch,
} from '../../utils';
const mockDel = jest.fn();
const mockGet = jest.fn().mockResolvedValue(String(validUser.id));
jest.mock('@lib/redisClient', () => ({
  redisClient: { del: mockDel, get: mockGet },
}));
const mockUuid = jest.fn(() => 'uuid-mocked');
jest.mock('uuid', () => ({ v4: mockUuid }));
const mockWhere = jest.fn();
const mockFirst = jest.fn().mockResolvedValue(validUser);
const mockKnex = jest.fn(() => ({
  innerJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: mockWhere.mockReturnThis(),
  first: mockFirst,
}));
jest.mock('knex', () => jest.fn(() => mockKnex));
const mockDetectCardId = jest
  .fn()
  .mockResolvedValue({ success: true, id: validUser.cardId });
jest.mock('@lib/detectCardId', () => ({ detectCardId: mockDetectCardId }));
const mockFetchJson = jest.fn();
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: mockFetchJson,
});
global.fetch = mockFetch;

import { restoreUpload } from '@controllers/upload/restore';
import express from 'express';
import request from 'supertest';
import '@lib/http';

const validPayload = {
  base64Image: 'base64Image',
  SVCRestoreToken: 'SVCRestoreToken',
  EACRestoreToken: 'EACRestoreToken',
};

describe('Restore Upload Controller', () => {
  const app = express();
  beforeAll(() => {
    app.use(express.json({ type: 'application/json' }));
    app.post('/', restoreUpload);
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
      request(app).post('/').send({ base64Image: 'base64Image' }),
      request(app).post('/').send({
        base64Image: 'base64Image',
        SVCRestoreToken: 'SVCRestoreToken',
      }),
    ]);
    responses.forEach((response) => {
      expect(response.badRequest);
    });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should return 404 when SVCRestoreToken not found', async () => {
    mockGet.mockResolvedValueOnce(null);
    const response = await request(app).post('/').send(validPayload);
    expect(mockGet).toHaveBeenCalledWith(
      `restore:${validPayload.SVCRestoreToken}`
    );
    expectResolvedValueEqual(mockGet, null);
    expect(response.notFound);
  });

  it('should return 404 when user not found', async () => {
    mockFirst.mockResolvedValueOnce(undefined);
    const response = await request(app).post('/').send(validPayload);
    expectResolvedValueEqual(mockGet, String(validUser.id));
    expect(mockWhere).toHaveBeenCalledWith({
      'users.id': String(validUser.id),
    });
    expectResolvedValueEqual(mockFirst, undefined);
    expect(response.notFound);
  });

  it('should return 422 when text detection fails', async () => {
    mockDetectCardId.mockResolvedValueOnce({ success: false });
    const response = await request(app).post('/').send(validPayload);
    expectResolvedValueEqual(mockFirst, validUser);
    expect(mockDetectCardId).toHaveBeenCalledWith(validPayload.base64Image);
    expectResolvedValueMatch(mockDetectCardId, { success: false });
    expect(response.notAcceptable);
  });

  it('should return 403 when detected card id is different than the one stored', async () => {
    mockDetectCardId.mockResolvedValueOnce({ success: true, id: 'not valid' });
    const response = await request(app).post('/').send(validPayload);
    expectResolvedValueEqual(mockFirst, validUser);
    expect(mockDetectCardId).toHaveBeenCalledWith(validPayload.base64Image);
    expectResolvedValueMatch(mockDetectCardId, {
      success: true,
      id: 'not valid',
    });
    expect(response.forbidden);
  });

  it('should dot many things when all is good', async () => {
    const response = await request(app).post('/').send(validPayload);
    expectResolvedValueMatch(mockFirst, validUser);
    expectResolvedValueMatch(mockDetectCardId, {
      success: true,
      id: validUser.cardId,
    });
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('uuid-mocked');
    expect(mockFetch.mock.lastCall[0]).toEqual(validUser.restoreWebhook);
    expect(mockFetch.mock.lastCall[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        EACRestoreToken: validPayload.EACRestoreToken,
        apiKey: 'uuid-mocked',
      }),
    });
    expect(mockDel).toHaveBeenCalledWith(
      `restore:${validPayload.SVCRestoreToken}`
    );
    expect(response.ok);
  });

  it('should return 500 if anything throws', async () => {
    mockGet.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockDel.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockFirst.mockImplementationOnce(() => {
      throw new Error('Intentional insert error');
    });
    const responses = await Promise.all([
      request(app).post('/').send(validPayload),
      request(app).post('/').send(validPayload),
      request(app).post('/').send(validPayload),
    ]);
    responses.forEach((response) => {
      expect(response.serverError);
    });
  });
});
