import { v4 as uuid } from 'uuid';
import {
  Integration,
  RegisterInitInput,
  RegisterInitOutput,
} from '@shared/types';
import { RedisClient } from '@shared/lib/RedisClient';

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

  public async initRegister({ email }: RegisterInitInput) {
    try {
      const EACRegisterToken = uuid();
      await this.redis.set(EACRegisterToken, 'pending', 60 * 10);
      const { SVCRegisterToken }: RegisterInitOutput = await fetch(
        `${this.url}/register`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AUTHSERVICE_INTEGRATION_API_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      ).then((res) => res.json());
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
    }).then((res) => res.json());
    return new ServerClient(integration, { url: baseUrl, apiKey: baseApiKey });
  }
}
