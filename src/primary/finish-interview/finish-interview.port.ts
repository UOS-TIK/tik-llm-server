import { Injectable } from '@nestjs/common';
import { LlmManager, VectorStoreManager } from '@src/secondary';
import { FinishInterviewData, FinishInterviewView } from './finish-interview.data';

@Injectable()
export class FinishInterviewPort {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly vectorStoreManager: VectorStoreManager,
  ) {}

  async execute(data: FinishInterviewData): Promise<FinishInterviewView> {
    this.llmManager.predict('qwe');
    this.vectorStoreManager.similaritySearch('asd');
    console.log('finish', data);
    return { bye: 'asd' };
  }
}
