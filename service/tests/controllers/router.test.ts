import request from 'supertest';
import express, { Request, Response } from 'express';

function mockRouterImplementation(_: Request, res: Response) {
  return res.json({ success: true });
}
const mockIntegrationsRouter = jest.fn(mockRouterImplementation);
const mockResetRouter = jest.fn(mockRouterImplementation);
const mockUploadRouter = jest.fn(mockRouterImplementation);

jest.mock('@controllers/integrations', () => mockIntegrationsRouter);
jest.mock('@controllers/reset', () => mockResetRouter);
jest.mock('@controllers/upload', () => mockUploadRouter);

import mainRouter from '@controllers/index';

describe('Main Router', () => {
  const app = express();
  beforeAll(() => {
    app.use(mainRouter);
  });
  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should use integrations router on [ALL] /integrations/<id>', async () => {
    await Promise.all([
      request(app).get('/integrations/123'),
      request(app).post('/integrations/123'),
      request(app).put('/integrations/123'),
      request(app).del('/integrations/123'),
      request(app).patch('/integrations/123'),
    ]);
    expect(mockIntegrationsRouter).toHaveBeenCalledTimes(5);
  });

  it('should use reset router on [ALL] /reset', async () => {
    await Promise.all([
      request(app).get('/reset'),
      request(app).post('/reset'),
      request(app).put('/reset'),
      request(app).del('/reset'),
      request(app).patch('/reset'),
    ]);
    expect(mockResetRouter).toHaveBeenCalledTimes(5);
  });

  it('should use upload router on [ALL] /upload', async () => {
    await Promise.all([
      request(app).get('/upload'),
      request(app).post('/upload'),
      request(app).put('/upload'),
      request(app).del('/upload'),
      request(app).patch('/upload'),
    ]);
    expect(mockUploadRouter).toHaveBeenCalledTimes(5);
  });
});
