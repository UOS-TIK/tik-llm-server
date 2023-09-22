import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { environment } from './environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(environment.port);

  console.log(`Server is running on ${environment.port}`);
}

bootstrap();
