import { INestiaConfig } from '@nestia/sdk';

const config: INestiaConfig = {
  input: 'src/controller',
  propagate: true,
  output: 'src/api',
  swagger: {
    output: 'swagger.json',
    security: {
      secret: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local Server',
      },
    ],
  },
};

export default config;
