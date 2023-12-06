import { TypedParam, TypedRoute } from '@nestia/core';
import { Controller, Res } from '@nestjs/common';
import { Response } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { MemoryStoreManager } from '../secondary';

@Controller('/_')
export class InternalController {
  constructor(private readonly memoryStoreManager: MemoryStoreManager) {}

  /**
   * @internal
   */
  @TypedRoute.Get('/demo')
  async renderHtml(@Res() res: Response): Promise<void> {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(await readFile(join(__dirname, '../../index.html')));
  }

  /**
   * @internal
   */
  @TypedRoute.Get('/test')
  async tsre() {
    await this.memoryStoreManager.set({
      id: 4,
      type: 'interviewHistory',
      value: ['면접관: 자 그러면, 면접 시작하겠습니다.'],
    });
    await this.memoryStoreManager.set({
      id: 4,
      type: 'interviewPaper',
      value: {
        items: [
          {
            question:
              'Next.js를 사용하여 서버 사이드 렌더링을 구현할 때, 클라이언트 사이드 렌더링과 비교했을 때의 성능상 이점과 주의해야 할 점에 대해 설명해주실 수 있나요?',
            answer: '',
            tailQuestions: [],
            isCompleted: false,
          },
        ],
        finalOneLineReview: '',
        finalScore: 0,
      },
    });
  }

  /**
   * @internal
   */
  @TypedRoute.Get('/interview-paper/:id')
  async getInterviewPaper(@TypedParam('id') id: number): Promise<Record<string, any>> {
    return {
      interviewHistory: await this.memoryStoreManager.get({ type: 'interviewHistory', id }),
      interviewPaper: await this.memoryStoreManager.get({ type: 'interviewPaper', id }),
    };
  }
}
