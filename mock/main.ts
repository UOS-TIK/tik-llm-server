import { NestFactory } from '@nestjs/core';
import { MockModule } from './mock.module';

async function bootstrap() {
  const app = await NestFactory.create(MockModule);

  await app.listen(4001);
}

bootstrap().then(() => {
  console.log(`Mock server is running on 4001`);
});
