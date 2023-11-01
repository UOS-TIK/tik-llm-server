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
    res.end(await readFile(join(__dirname, '../index.html')));
  }

  /**
   * @internal
   */
  @TypedRoute.Get('/interview-paper/:id')
  async getInterviewPaper(@TypedParam('id') id: number): Promise<Record<string, any>> {
    await this.memoryStoreManager.set({
      type: 'interviewLock',
      id,
      value: true,
    });
    await this.memoryStoreManager.set({
      type: 'interviewHistory',
      id,
      value: [
        '면접관: 데이터베이스의 정규화에 대해 설명해주실 수 있나요? 그리고 정규화를 진행하면서 겪었던 어려움이나 이슈에 대해 구체적으로 말씀해주실 수 있나요?',
        '지원자: 잘 모르겠습니다.',
      ],
    });
    await this.memoryStoreManager.set({
      type: 'interviewPaper',
      id,
      value: {
        finalOneLineReview: '',
        finalScore: 0,
        items: [
          {
            question:
              '데이터베이스의 정규화에 대해 설명해주실 수 있나요? 그리고 정규화를 진행하면서 겪었던 어려움이나 이슈에 대해 구체적으로 말씀해주실 수 있나요?',
            answer: '잘 모르겠습니다',
            isCompleted: true,
            tailQuestions: [],
          },
        ],
      },
    });

    return {
      interviewPaper: await this.memoryStoreManager.get({ type: 'interviewPaper', id }),
    };
  }
}
