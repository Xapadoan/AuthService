const validUser = {
  id: 1,
  cardId: 'pending',
  email: 'email',
  registerWebhook: 'register',
};
const mockDel = jest.fn();
const mockGet = jest.fn().mockResolvedValue(String(validUser.id));
jest.mock('@lib/redisClient', () => ({
  redisClient: { del: mockDel, get: mockGet },
}));
const mockUuid = jest.fn(() => 'uuid-mocked');
jest.mock('uuid', () => ({ v4: mockUuid }));
const mockUpdate = jest.fn();
const mockWhere = jest.fn();
const mockFirst = jest.fn().mockResolvedValue(validUser);
const mockKnex = jest.fn(() => ({
  innerJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
  where: mockWhere.mockReturnThis(),
  first: mockFirst,
}));
jest.mock('knex', () => jest.fn(() => mockKnex));
const validCardId = '123123123123';
const mockDetectCardId = jest
  .fn()
  .mockResolvedValue({ success: true, id: validCardId });
jest.mock('@lib/detectCardId', () => ({ detectCardId: mockDetectCardId }));
const mockFetchJson = jest.fn();
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: mockFetchJson,
});
global.fetch = mockFetch;

import { registerUpload } from '@controllers/upload/register';
import express from 'express';
import request from 'supertest';
import '@lib/http';
import {
  expectResolvedValueEqual,
  expectResolvedValueMatch,
} from '../../utils';

const validPayload = {
  base64Image: 'base64Image',
  SVCRegisterToken: 'SVCRegisterToken',
  EACRegisterToken: 'EACRegisterToken',
};

describe('Register Upload Controller', () => {
  const app = express();
  beforeAll(() => {
    app.use(express.json({ type: 'application/json' }));
    app.post('/', registerUpload);
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
        SVCRegisterToken: 'SVCRegisterToken',
      }),
    ]);
    responses.forEach((response) => {
      expect(response.badRequest);
    });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should return 404 when SVCRegisterToken not found', async () => {
    mockGet.mockResolvedValueOnce(null);
    const response = await request(app).post('/').send(validPayload);
    expect(mockGet).toHaveBeenCalledWith(validPayload.SVCRegisterToken);
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

  it('should dot many things when all is good', async () => {
    const response = await request(app).post('/').send(validPayload);
    expectResolvedValueMatch(mockFirst, validUser);
    expectResolvedValueMatch(mockDetectCardId, {
      success: true,
      id: validCardId,
    });
    expect(mockUpdate).toHaveBeenCalledWith({ cardId: validCardId });
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('uuid-mocked');
    expect(mockFetch.mock.lastCall[0]).toEqual(validUser.registerWebhook);
    expect(mockFetch.mock.lastCall[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        apiKey: 'uuid-mocked',
        EACRegisterToken: validPayload.EACRegisterToken,
      }),
    });
    expect(mockDel).toHaveBeenCalled();
    expect(response.ok);
  });

  it('should return 500 if anything throws', async () => {
    mockGet.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockDel.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockUpdate.mockImplementationOnce(() => {
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
