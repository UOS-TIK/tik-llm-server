import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { InternalController } from './internal.controller';
import { FinishInterviewPort } from './primary/finish-interview';
import { InitInterviewPort } from './primary/init-interview';
import { SpeakToInterviewerPort } from './primary/speak-to-interviewer';
import { LlmManager, MemoryStoreManager, VectorStoreManager } from './secondary';

@Module({
  imports: [],
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
  ],
})
export class AppModule {}
