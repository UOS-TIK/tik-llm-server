import * as dotenv from 'dotenv';

dotenv.config({ path: `.env` });

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export const environment = {
  tz: process.env.TZ! as string,
  port: +process.env['PORT']! as number,
  secret: process.env['SECRET']! as string,
  openai: {
    api: {
      key: process.env['OPENAI_API_KEY']! as string,
    },
  },
  huggingfacehub: {
    api: {
      key: process.env['HUGGINGFACEHUB_API_KEY']! as string,
    },
  },
  pinecone: {
    api: {
      key: process.env['PINECONE_API_KEY']! as string,
    },
    index: {
      name: process.env['PINECONE_INDEX_NAME']! as string,
    },
    environment: {
      region: process.env['PINECONE_ENVIRONMENT_REGION']! as string,
    },
  },
  redis: {
    host: process.env['REDIS_HOST']! as string,
    port: +process.env['REDIS_PORT']! as number,
  },
  main: {
    server: {
      url: process.env['MAIN_SERVER_URL']! as string,
    },
  },
};
