import { v4 as uuid } from 'uuid';
import {
  Integration,
  RegisterInitInput,
  RegisterInitOutput,
} from '@shared/types';
import { RedisClient } from '@shared/lib/RedisClient';

interface Config {
  host: string;
  registerPath: string;
}

export default class ServerClient {
  readonly integration: Integration;
  readonly config: Config;
  private redis = new RedisClient({ prefix: 'authservice-server' });

  constructor(integration: Integration, config?: Partial<Config>) {
    this.integration = integration;
    this.config = {
      host: 'http://localhost:8080',
      registerPath: 'register',
      ...(config || {}),
    };
  }

  public async initRegister({ email }: RegisterInitInput) {
    try {
      const EACRegisterToken = uuid();
      await this.redis.set(EACRegisterToken, 'pending', 60 * 10);
      const { SVCRegisterToken }: RegisterInitOutput = await fetch(
        `${this.config.host}/${this.integration.id}/${this.config.registerPath}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.integration.apiKey}`,
          },
          body: JSON.stringify({ email }),
        }
      ).then((res) => res.json());
      return {
        uploadUrl: `${this.config.host}/${this.integration.id}/${this.config.registerPath}`,
        SVCRegisterToken,
        EACRegisterToken,
      };
    } catch (error) {
      console.error('Init Register Error: ', error);
    }
  }
}
