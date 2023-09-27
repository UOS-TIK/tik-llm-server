import { INestiaConfig } from '@nestia/sdk';

const config: INestiaConfig = {
  input: 'src/app.controller.ts',
  swagger: {
    output: 'swagger.json',
    security: {
      bearer: {
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
