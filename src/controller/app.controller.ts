import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import {
  InitInterviewData,
  InitInterviewException,
  InitInterviewPort,
  InitInterviewView,
} from '../primary/init-interview';
import {
  SpeakToInterviewerData,
  SpeakToInterviewerException,
  SpeakToInterviewerPort,
  SpeakToInterviewerView,
} from '../primary/speak-to-interviewer';
import {
  FinishInterviewData,
  FinishInterviewPort,
  FinishInterviewView,
  FinishInterviewException,
} from '../primary/finish-interview';

@Controller('/')
export class AppController {
  constructor(
    private readonly initInterviewPort: InitInterviewPort,
    private readonly speakToInterviewerPort: SpeakToInterviewerPort,
    private readonly finishInterviewPort: FinishInterviewPort,
  ) {}

  /**
   * 면접 시작 하기.
   *
   * @tag Interview
   *
   * @security secret
   *
   * @param data req body
   *
   * @return response type
   */
  @TypedException<InitInterviewException>('4XX')
  @TypedRoute.Post('/init')
  async initInterview(@TypedBody() data: InitInterviewData): Promise<InitInterviewView> {
    return this.initInterviewPort.execute(data);
  }

  /**
   * 면접관에게 대답하기.
   *
   * @tag Interview
   *
   * @security secret
   *
   * @param data req body
   *
   * @return response type
   */
  @TypedException<SpeakToInterviewerException>('4XX')
  @TypedRoute.Post('/speak')
  async speakToInterviewer(
    @TypedBody() data: SpeakToInterviewerData,
  ): Promise<SpeakToInterviewerView> {
    return this.speakToInterviewerPort.execute(data);
  }

  /**
   * 면접 결과 확인하기.
   *
   * @tag Interview
   *
   * @security secret
   *
   * @param data req body
   *
   * @return response type
   */
  @TypedException<FinishInterviewException>('4XX')
  @TypedRoute.Post('/finish')
  async finishInterview(@TypedBody() data: FinishInterviewData): Promise<FinishInterviewView> {
    return this.finishInterviewPort.execute(data);
  }
}
