import { Knex } from 'knex';

const commonConfig: Knex.Config = {
  client: 'mysql2',
  connection: {
    port: Number(process.env.DB_PORT),
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    charset: 'utf8mb4',
  },
  migrations: {
    directory: 'src/data/migrations',
  },
};

export default {
  production: commonConfig,
  development: { ...commonConfig, debug: true },
  local: { ...commonConfig, debug: true },
  test: {
    ...commonConfig,
    migrations: {
      directory: 'src/data/migrations',
    },
    seeds: {
      directory: 'tests/seeds',
    },
  },
};
