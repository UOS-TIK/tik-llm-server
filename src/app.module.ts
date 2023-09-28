import { Module } from '@nestjs/common';
import { AopModule } from '@toss/nestjs-aop';
import { AppController } from './app.controller';
import { InterviewLockAspect } from './common';
import { InternalController } from './internal.controller';
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
  ],
})
export class AppModule {}
