import { Module } from '@nestjs/common';
import { MockAppController } from './mock.controller';

@Module({
  controllers: [MockAppController],
})
export class MockModule {}
