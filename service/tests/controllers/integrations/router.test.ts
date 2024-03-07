import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import { validIntegration } from '../../utils';

function endpoint(_: Request, res: Response) {
  return res.json({ success: true });
}

const mockIntegrationAuth = jest.fn(
  (req: Request, _res, next: NextFunction) => {
    req.integration = validIntegration;
    return next();
  }
);
const mockRead = jest.fn(endpoint);
const mockInitRegister = jest.fn(endpoint);
const mockInitReset = jest.fn(endpoint);
const mockInitRestore = jest.fn(endpoint);

jest.mock('@middlewares/integrationAuth', () => ({
  integrationAuth: mockIntegrationAuth,
}));
jest.mock('@controllers/integrations/read', () => ({ read: mockRead }));
jest.mock('@controllers/integrations/initRegister', () => ({
  initRegister: mockInitRegister,
}));
jest.mock('@controllers/integrations/initRestore', () => ({
  initRestore: mockInitRestore,
}));
jest.mock('@controllers/integrations/initReset', () => ({
  initReset: mockInitReset,
}));

import integrationsRouter from '@controllers/integrations';

describe('Integrations router', () => {
  const app = express();
  beforeAll(() => {
    app.use(express.json({ type: 'application/json' }));
    app.use(integrationsRouter);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('should read on [GET] / with integrationAuth', async () => {
    await request(app).get('/');
    expect(mockRead).toHaveBeenCalled();
    expect(mockRead.mock.lastCall?.[0]).toMatchObject({
      integration: validIntegration,
    });
  });

  it('should initRegister on [POST] /register with integrationAuth', async () => {
    await request(app).post('/register');
    expect(mockInitRegister).toHaveBeenCalled();
    expect(mockInitRegister.mock.lastCall?.[0]).toMatchObject({
      integration: validIntegration,
    });
  });

  it('should initRestore on [POST] /restore with integrationAuth', async () => {
    await request(app).post('/restore');
    expect(mockInitRestore).toHaveBeenCalled();
    expect(mockInitRestore.mock.lastCall?.[0]).toMatchObject({
      integration: validIntegration,
    });
  });

  it('should initReset on [POST] /reset with integrationAuth', async () => {
    await request(app).post('/reset');
    expect(mockInitReset).toHaveBeenCalled();
    expect(mockInitReset.mock.lastCall?.[0]).toMatchObject({
      integration: validIntegration,
    });
  });
});
