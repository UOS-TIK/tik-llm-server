import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { environment } from './common/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: [`${environment.main.server.url.split(':')[0]}:3000`],
  });
  /* eslint-disable @typescript-eslint/no-var-requires */
  try {
    SwaggerModule.setup('docs', app, require(join(__dirname, '../swagger.json')));
  } catch {
    SwaggerModule.setup('docs', app, require(join(__dirname, '../../swagger.json')));
  }

  await app.listen(environment.port);
}

bootstrap().then(() => {
  console.log(`Server is running on ${environment.port}`);
});

process.on('uncaughtException', (error: Error) => {
  console.log(`Uncaught Exception: ${error.message}`);
});

process.on('unhandledRejection', (error: Error) => {
  console.log(`Unhandled Rejection: ${error.message}`);
});
