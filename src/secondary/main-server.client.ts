import { Injectable } from '@nestjs/common';
import { environment } from '@src/common';
import axios from 'axios';

@Injectable()
export class MainServerClient {
  private client = axios.create({
    baseURL: environment.main.server.url,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0MTIzNCIsImF1dGgiOiJST0xFX01FTUJFUiIsInVzZXJJZCI6MTMsImlhdCI6MTcwMjA1MDQ1MCwiZXhwIjoxNzAzODAzNDgzfQ.McHdkeg3p9pn-wbEax3cI_8fXho5GUSNR96C7IaCzmI`,
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
