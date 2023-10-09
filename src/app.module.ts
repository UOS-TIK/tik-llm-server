import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AopModule } from '@toss/nestjs-aop';
import { AllExceptionFilter, AuthGuard, InterviewLockAspect } from './common';
import { AppController, InternalController } from './controller';
import { FinishInterviewPort } from './primary/finish-interview';
import { InitInterviewPort } from './primary/init-interview';
import { SpeakToInterviewerPort } from './primary/speak-to-interviewer';
import { LlmManager, MemoryStoreManager, VectorStoreManager } from './secondary';

@Module({
  imports: [AopModule],
  controllers: [AppController, InternalController],
  providers: [
    // primary
    InitInterviewPort,
    SpeakToInterviewerPort,
    FinishInterviewPort,
    // secondary
    LlmManager,
    MemoryStoreManager,
    VectorStoreManager,
    // common
    InterviewLockAspect,
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
