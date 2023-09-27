import { BadRequestException, Injectable } from '@nestjs/common';
import { LlmManager, MemoryStoreManager } from '@src/secondary';
import { FinishInterviewData, FinishInterviewView } from './finish-interview.data';

@Injectable()
export class FinishInterviewPort {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly memoryStoreManager: MemoryStoreManager,
  ) {}

  async execute(data: FinishInterviewData): Promise<FinishInterviewView> {
    const interviewHistory = await this.memoryStoreManager.get({
      type: 'interviewHistory',
      id: data.interviewId,
    });

    const interviewPaper = await this.memoryStoreManager.get({
      type: 'interviewPaper',
      id: data.interviewId,
    });
    if (interviewPaper.filter((each) => each.isCompleted === false).length) {
      throw new BadRequestException(`interview is not finished. id=${data.interviewId}`);
    }

    const result = await this.llmManager.predict<{
      interviewPaper: Required<typeof interviewPaper>;
    }>(this.buildPrompt(interviewPaper));

    return {
      interviewHistory,
      interviewPaper: JSON.stringify(result.interviewPaper, null, 2),
    };
  }

  private buildPrompt<T extends { question: string; answer: string }>(interviewPaper: T[]) {
    return `
###Role
You are a senior developer evaluating interview applicants' answers.
Look at the interview paper below and give them a score with comments in Korean.

###InterviewPaper
type InterviewItem = {
  question: string; // The questions asked by the interviewer
  answer: string; // The applicant's answer.
  tailQuestions: { // Additional questions the interviewer asked.
    question: string;
    answer: string;
  }[];
  isCompleted: boolean, // Indicates whether this topic is completed.
  evaluation: { // This is what you need to update.
    comment: string; // As much detail as possible
    score: number; // On a scale of 10
  };
};

***interviewPaper: ${JSON.stringify(
      interviewPaper.map((each) => ({
        ...each,
        evaluation: {
          comment: '',
          score: 0,
        },
      })),
    )}

###Response
Please follow this JSON format for your response

{
  "interviewPaper": {}
}
`.trim();
  }
}
