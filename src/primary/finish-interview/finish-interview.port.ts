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
        interviewPaper: interviewPaper as typeof updatedInterviewPaper,
      };
    }

    const itemResult = await this.llmManager.predict<{
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
    }>(this.buildItemPrompt(interviewPaper.items));

    const finalResult = await this.llmManager.predict<{
      finalOneLineReview: string;
      finalScore: number;
    }>(this.buildFinalPrompt(interviewPaper.items));

    const updatedInterviewPaper = {
      ...itemResult,
      ...finalResult,
    } satisfies typeof interviewPaper;

    await this.memoryStoreManager.set({
      type: 'interviewPaper',
      id: data.interviewId,
      value: updatedInterviewPaper,
    });

    return {
      interviewHistory,
      interviewPaper: updatedInterviewPaper,
    };
  }

  private buildItemPrompt<T extends { question: string }>(interviewItems: T[]) {
    return `
###Role
You are a senior developer evaluating interview applicants' answers.
Look at the interview items below and give them a score with comment in Korean.

###InterviewItem
type InterviewItem = {
    question: string; // The questions asked by the interviewer
    answer: string; // The applicant's answer.
    evaluation: { // This is what you must update.
      comment: string; // As much detail as possible
      score: number; // Out of 10, an 7 or higher is a passing score.
    };
    tailQuestions: { // Additional questions the interviewer asked. (Don't remove tailQuestion elements!)
      question: string;
      answer: string;
      evaluation: { // This is what you must update.
        comment: string; // As much detail as possible
        score: number; // Out of 10, an 7 or higher is a passing score.
      };
    }[];
    isCompleted: boolean, // Indicates whether this topic is completed.
}

***items: ${JSON.stringify(interviewItems)}

###Response Example:
Please follow this JSON format for your response.
{
  "items": [{}]
}
- Evaluate for all items & item's tailQuestion elements.
- Don't remove tailQuestion elements.
`.trim();
  }

  private buildFinalPrompt<T extends { question: string }>(interviewItems: T[]) {
    return `
You are a senior developer evaluating interview applicants' answers.
Look at the interview items below and give final score & review in Korean.

###InterviewItems
${JSON.stringify(interviewItems)}

###Response Example:
Please follow this JSON format for your response.
{
  "finalOneLineReview": string; // A comprehensive one-line evaluation.
  "finalScore": number; // Out of 10, an 7 or higher is a passing score.
}
`.trim();
  }
}
