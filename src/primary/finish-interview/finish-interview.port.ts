import { BadRequestException, Injectable } from '@nestjs/common';
import { MemoryStoreManager } from '@src/secondary';
import { FinishInterviewData, FinishInterviewView } from './finish-interview.data';

@Injectable()
export class FinishInterviewPort {
  constructor(private readonly memoryStoreManager: MemoryStoreManager) {}

  async execute(data: FinishInterviewData): Promise<FinishInterviewView> {
    const interviewPaper = await this.memoryStoreManager.get({
      type: 'interviewPaper',
      id: data.interviewId,
    });
    if (interviewPaper.filter((each) => each.isCompleted === false).length) {
      throw new BadRequestException(`interview is not finished. id=${data.interviewId}`);
    }

    const interviewHistory = await this.memoryStoreManager.get({
      type: 'interviewHistory',
      id: data.interviewId,
    });

    console.log(4444, JSON.stringify(interviewPaper));
    console.log(5555, interviewHistory);

    return { result: interviewHistory.join(', ') };
  }
}
