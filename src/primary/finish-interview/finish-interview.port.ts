import { BadRequestException, Injectable } from '@nestjs/common';
import { InterviewLock } from '@src/common';
import { LlmManager, MemoryStoreManager } from '@src/secondary';
import { FinishInterviewData, FinishInterviewView } from './finish-interview.data';

@Injectable()
export class FinishInterviewPort {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly memoryStoreManager: MemoryStoreManager,
  ) {}

  @InterviewLock(300)
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

    if (interviewPaper[0]?.evaluation?.comment) {
      return {
        interviewHistory,
        interviewPaper: interviewPaper as typeof result.interviewPaper,
      };
    }

    const result = await this.llmManager.predict<{
      interviewPaper: {
        question: string;
        answer: string;
        evaluation: {
          comment: string;
          score: number;
        };
        tailQuestions: {
          question: string;
          answer: string;
          evaluation: {
            comment: string;
            score: number;
          };
        }[];
        isCompleted: boolean;
      }[];
    }>(this.buildPrompt(interviewPaper));

    await this.memoryStoreManager.set({
      type: 'interviewPaper',
      id: data.interviewId,
      value: result.interviewPaper,
    });

    return {
      interviewHistory,
      interviewPaper: result.interviewPaper,
    };
  }

  private buildPrompt<T extends { question: string; answer: string }>(interviewPaper: T[]) {
    return `
###Role
You are a senior developer evaluating interview applicants' answers.
Look at the interview paper below and give them a score with comment in Korean.

###InterviewPaper
type InterviewItem = {
  question: string; // The questions asked by the interviewer
  answer: string; // The applicant's answer.
  evaluation: { // This is what you must update.
    comment: string; // As much detail as possible
    score: number; // On a scale of 10
  };
  tailQuestions: { // Additional questions the interviewer asked.
    question: string;
    answer: string;
    evaluation: {
      comment: string;
      score: number;
    };
  }[];
  isCompleted: boolean, // Indicates whether this topic is completed.
};

***interviewPaper: ${JSON.stringify(interviewPaper)}

###Response Example:
Please follow this JSON format for your response
{
  "interviewPaper": [{}]
}
- Do not remove tailQuestions
- Please feedback for all tailQuestions
`.trim();
  }
}
