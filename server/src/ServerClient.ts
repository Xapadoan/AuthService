import { v4 as uuid } from 'uuid';
import {
  Failable,
  handleResponse,
  Integration,
  RedisClient,
  RegisterInitServiceInput,
  RegisterInitServiceOutput,
  RegisterInitServerOutput,
  RegisterUploadServerInput,
  RegisterSessionSetupInput,
  RestoreInitServiceInput,
  RestoreInitServerOutput,
  RestoreInitServiceOutput,
  RestoreUploadServerInput,
  RestoreSessionSetupInput,
  ResetInitServiceInput,
  ResetInitServerOutput,
  ResetUploadServerInput,
  ResetSessionSetupInput,
  SessionSetupServerOutput,
} from '@authservice/shared';

const {
  AUTHSERVICE_INTEGRATION_ID,
  AUTHSERVICE_INTEGRATION_API_KEY,
  AUTHSERVICE_SERVICE_HOST,
} = process.env;

interface Config {
  url: string;
  apiKey: string;
}

export class ServerClient {
  readonly integration: Integration;
  readonly url: string;
  readonly apiKey: string;
  private redis = new RedisClient({ prefix: 'authservice-server' });
  readonly sessionDuration = 60 * 24 * 3600;
  readonly tmpStorageDuration = 10 * 60;

  private constructor(integration: Integration, { url, apiKey }: Config) {
    this.integration = integration;
    this.apiKey = apiKey;
    this.url = url;
  }

  public async onRegisterUpload({
    EACRegisterToken,
    sessionId,
  }: RegisterUploadServerInput) {
    return this.replaceTmp(`register:${EACRegisterToken}`, sessionId);
  }

  public async onRestoreUpload({
    EACRestoreToken,
    sessionId,
  }: RestoreUploadServerInput) {
    return this.replaceTmp(`restore:${EACRestoreToken}`, sessionId);
  }

  public async onResetConfirm() {
    const EACResetToken = uuid();
    await this.redis.set(
      `reset:${EACResetToken}`,
      'pending',
      this.tmpStorageDuration
    );
    return EACResetToken;
  }

  public async onResetUpload({
    EACResetToken,
    sessionId,
  }: ResetUploadServerInput) {
    return this.replaceTmp(`reset:${EACResetToken}`, sessionId);
  }

  private async replaceTmp(key: string, value: string): Promise<Failable> {
    const pendingValue = await this.redis.get(key);
    if (pendingValue !== 'pending')
      return { success: false, error: 'No pending value' };
    await this.redis.set(key, value, this.tmpStorageDuration);
    return { success: true };
  }

  public async registerSetupSession({
    userId,
    EACRegisterToken,
  }: RegisterSessionSetupInput) {
    return this.setupSession(userId, `register:${EACRegisterToken}`);
  }

  public async restoreSetupSession({
    userId,
    EACRestoreToken,
  }: RestoreSessionSetupInput) {
    return this.setupSession(userId, `restore:${EACRestoreToken}`);
  }

  public async resetSetupSession({
    userId,
    EACResetToken,
  }: ResetSessionSetupInput) {
    return this.setupSession(userId, `reset:${EACResetToken}`);
  }

  private async setupSession(
    userId: string,
    key: string
  ): Promise<Failable<SessionSetupServerOutput>> {
    const sessionId = await this.redis.get(key);
    if (!sessionId) {
      return { success: false, error: 'Not found' };
    }
    await this.redis.set(`session:${sessionId}`, userId, this.sessionDuration);
    await this.redis.del(key);
    return {
      success: true,
      sessionId: sessionId,
      maxAge: this.sessionDuration * 1000,
    };
  }

  public async readSession(sessionId: string) {
    return this.redis.get(`session:${sessionId}`);
  }

  public async deleteSession(sessionId: string) {
    return this.redis.del(`session:${sessionId}`);
  }

  public async initRegister({
    email,
  }: RegisterInitServiceInput): Promise<RegisterInitServerOutput | undefined> {
    try {
      const EACRegisterToken = uuid();
      await this.redis.set(
        `register:${EACRegisterToken}`,
        'pending',
        this.tmpStorageDuration
      );
      const { SVCRegisterToken }: RegisterInitServiceOutput =
        await this.fetchService('register', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      return {
        uploadUrl: `${AUTHSERVICE_SERVICE_HOST}/upload/register`,
        SVCRegisterToken,
        EACRegisterToken,
      };
    } catch (error) {
      console.error('Init Register Error: ', error);
    }
  }

  public async initRestore({
    email,
  }: RestoreInitServiceInput): Promise<RestoreInitServerOutput | undefined> {
    try {
      const EACRestoreToken = uuid();
      await this.redis.set(
        `restore:${EACRestoreToken}`,
        'pending',
        this.tmpStorageDuration
      );
      const { SVCRestoreToken }: RestoreInitServiceOutput =
        await this.fetchService('restore', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      return {
        uploadUrl: `${AUTHSERVICE_SERVICE_HOST}/upload/restore`,
        SVCRestoreToken,
        EACRestoreToken,
      };
    } catch (error) {
      console.error('Init Restore Error: ', error);
    }
  }

  public async initReset({
    email,
  }: ResetInitServiceInput): Promise<ResetInitServerOutput | undefined> {
    try {
      await this.fetchService<Failable>('reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { uploadUrl: `${AUTHSERVICE_SERVICE_HOST}/upload/reset` };
    } catch (error) {
      console.error('Init Reset Error: ', error);
    }
  }

  public static async init(initParams?: {
    integrationId?: number;
    apiKey?: string;
  }) {
    const baseUrl = `${AUTHSERVICE_SERVICE_HOST}/integrations/${initParams?.integrationId || AUTHSERVICE_INTEGRATION_ID}`;
    const baseApiKey = initParams?.apiKey || AUTHSERVICE_INTEGRATION_API_KEY;
    if (!baseApiKey) throw new Error('Api key is required');
    const integration: Integration = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${baseApiKey}`,
      },
    }).then((res) => handleResponse<Integration>(res));
    return new ServerClient(integration, { url: baseUrl, apiKey: baseApiKey });
  }

  private async fetchService<T>(
    endpoint: 'register' | 'restore' | 'reset',
    init?: RequestInit
  ) {
    return fetch(`${this.url}/${endpoint}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    }).then((res) => handleResponse<T>(res));
  }
}
