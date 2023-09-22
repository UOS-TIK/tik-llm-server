import { TypedBody, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { InitInterviewData, InitInterviewPort, InitInterviewView } from './primary/init-interview';
import {
  SpeakToInterviewerData,
  SpeakToInterviewerPort,
  SpeakToInterviewerView,
} from './primary/speak-to-interviewer';
import {
  FinishInterviewData,
  FinishInterviewPort,
  FinishInterviewView,
} from './primary/finish-interview';

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
   * @security bearer
   *
   * @param data req body
   *
   * @return response type
   */
  @TypedRoute.Post('/init')
  async initInterview(@TypedBody() data: InitInterviewData): Promise<InitInterviewView> {
    return this.initInterviewPort.execute(data);
  }

  /**
   * 면접관에게 대답하기.
   *
   * @tag Interview
   *
   * @security bearer
   *
   * @param data req body
   *
   * @return response type
   */
  @TypedRoute.Post('/speak')
  async speakToInterviewer(
    @TypedBody() data: SpeakToInterviewerData,
  ): Promise<SpeakToInterviewerView> {
    return this.speakToInterviewerPort.execute(data);
  }

  /**
   * 면접 종료하기.
   *
   * @tag Interview
   *
   * @security bearer
   *
   * @param data req body
   *
   * @return response type
   */
  @TypedRoute.Post('/finish')
  async finishInterview(@TypedBody() data: FinishInterviewData): Promise<FinishInterviewView> {
    return this.finishInterviewPort.execute(data);
  }
}
