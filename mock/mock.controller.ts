import { TypedBody, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { AppController } from '@src/controller';
import { FinishInterviewData, FinishInterviewView } from '@src/primary/finish-interview';
import { InitInterviewData, InitInterviewView } from '@src/primary/init-interview';
import { SpeakToInterviewerData, SpeakToInterviewerView } from '@src/primary/speak-to-interviewer';
import typia from 'typia';
import { MockResponse } from './type';

/* eslint-disable @typescript-eslint/no-unused-vars */
@Controller('/')
export class MockAppController extends AppController {
  constructor() {
    super(1 as any, 1 as any, 1 as any);
  }

  @TypedRoute.Post('/init')
  override async initInterview(@TypedBody() _data: InitInterviewData): Promise<InitInterviewView> {
    return typia.random<MockResponse<InitInterviewView>>();
  }

  @TypedRoute.Post('/speak')
  override async speakToInterviewer(
    @TypedBody() _data: SpeakToInterviewerData,
  ): Promise<SpeakToInterviewerView> {
    return typia.random<MockResponse<SpeakToInterviewerView>>();
  }

  @TypedRoute.Post('/finish')
  override async finishInterview(
    @TypedBody() _data: FinishInterviewData,
  ): Promise<FinishInterviewView> {
    return typia.random<MockResponse<FinishInterviewView>>();
  }
}
