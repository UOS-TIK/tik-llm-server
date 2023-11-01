import { Injectable } from '@nestjs/common';
import { environment } from '@src/common';
import axios from 'axios';

@Injectable()
export class MainServerClient {
  private client = axios.create({
    baseURL: environment.main.server.url,
    headers: {
      'Content-Type': 'application/json',
    },
    responseType: 'json',
  });

  async finishInterview(params: { interviewId: number }) {
    return this.client
      .post('/interview/finish', {
        interviewId: params.interviewId,
      })
      .catch((err) => {
        throw new Error(
          `notifyEvaluationFinished failed. err=${JSON.stringify(err.response.data)}`,
        );
      });
  }
}
