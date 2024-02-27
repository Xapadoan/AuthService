import { v4 as uuid } from 'uuid';
import {
  Integration,
  RegisterInitServiceInput,
  RegisterInitServiceOutput,
  RedisClient,
  handleResponse,
} from 'shared';

const {
  AUTHSERVICE_INTEGRATION_ID,
  AUTHSERVICE_INTEGRATION_API_KEY,
  AUTHSERVICE_SERVICE_HOST,
} = process.env;

interface Config {
  url: string;
  apiKey: string;
}

export default class ServerClient {
  readonly integration: Integration;
  readonly url: string;
  readonly apiKey: string;
  private redis = new RedisClient({ prefix: 'authservice-server' });

  private constructor(integration: Integration, { url, apiKey }: Config) {
    this.integration = integration;
    this.apiKey = apiKey;
    this.url = url;
  }

  public async initRegister({ email }: RegisterInitServiceInput) {
    try {
      const EACRegisterToken = uuid();
      await this.redis.set(EACRegisterToken, 'pending', 60 * 10);
      const { SVCRegisterToken }: RegisterInitServiceOutput =
        await this.fetchService('register', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      return {
        uploadUrl: `${this.url}/register`,
        SVCRegisterToken,
        EACRegisterToken,
      };
    } catch (error) {
      console.error('Init Register Error: ', error);
    }
  }

  public static async init(initParams?: {
    integrationId?: number;
    apiKey?: string;
  }) {
    const baseUrl = `${AUTHSERVICE_SERVICE_HOST}/${initParams?.integrationId || AUTHSERVICE_INTEGRATION_ID}`;
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

  private async fetchService<T>(endpoint: 'register', init?: RequestInit) {
    return fetch(`${this.url}/${endpoint}`, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    }).then((res) => handleResponse<T>(res));
  }
}
