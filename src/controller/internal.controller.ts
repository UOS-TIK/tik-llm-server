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
    return {
      interviewPaper: await this.memoryStoreManager.get({ type: 'interviewPaper', id }),
    };
  }
}
