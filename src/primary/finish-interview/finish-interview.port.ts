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
    if (interviewPaper.items.filter((each) => each.isCompleted === false).length) {
      throw new BadRequestException(`interview is not finished. id=${data.interviewId}`);
    }

    if (interviewPaper.finalOneLineReview) {
      return {
        interviewHistory,
        interviewPaper: interviewPaper as typeof result.interviewPaper,
      };
    }

    const result = await this.llmManager.predict<{
      interviewPaper: {
        items: {
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
        finalOneLineReview: string;
        finalScore: number;
      };
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

  private buildPrompt<T extends { finalOneLineReview: string }>(interviewPaper: T) {
    return `
###Role
You are a senior developer evaluating interview applicants' answers.
Look at the interview paper below and give them a score with comment in Korean.

###InterviewPaper
type InterviewPaper = {
  items: { // interview items
    question: string; // The questions asked by the interviewer
    answer: string; // The applicant's answer.
    evaluation: { // This is what you must update.
      comment: string; // As much detail as possible
      score: number; // Out of 10
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
  finalOneLineReview: string; // A comprehensive one-line evaluation.
  finalScore: number; // Out of 10, an 7 or higher is a passing score.
}

***interviewPaper: ${JSON.stringify(interviewPaper)}

###Response Example:
Please follow this JSON format for your response
{
  "interviewPaper": {
    "items": [...],
    "finalOneLineReview": "review about interview",
    "finalScore": 8, 
  }
}
- Please feedback for all tailQuestions
- Do not remove tailQuestions!
`.trim();
  }
}
