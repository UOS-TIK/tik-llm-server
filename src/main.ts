import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { environment } from './environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: 'http://127.0.0.1:5500' });

  await app.listen(environment.port);
}

bootstrap().then(() => {
  console.log(`Server is running on ${environment.port}`);
});
