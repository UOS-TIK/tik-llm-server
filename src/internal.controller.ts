import { TypedParam, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { MemoryStoreManager } from './secondary';

@Controller('/_')
export class InternalController {
  constructor(private readonly memoryStoreManager: MemoryStoreManager) {}

  /**
   * @internal
   */
  @TypedRoute.Get('/interview-paper/:id')
  async getInterviewPaper(@TypedParam('id') id: number) {
    return {
      interviewPaper: await this.memoryStoreManager.get({ type: 'interviewPaper', id }),
    };
  }
}
