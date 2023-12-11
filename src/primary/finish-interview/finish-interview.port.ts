import { Injectable } from '@nestjs/common';
import { LockInterview } from '@src/common';
import { LlmManager, MainServerClient, MemoryStoreManager } from '@src/secondary';
import {
  FinishInterviewData,
  FinishInterviewView,
  FinishInterviewException,
} from './finish-interview.data';

@Injectable()
export class FinishInterviewPort {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly memoryStoreManager: MemoryStoreManager,
    private readonly mainServerClient: MainServerClient,
  ) {}

  @LockInterview(300, 1)
  async execute(data: FinishInterviewData): Promise<FinishInterviewView> {
    const [interviewPaper, interviewHistory] = await Promise.all([
      this.memoryStoreManager.get({
        type: 'interviewPaper',
        id: data.interviewId,
      }),
      this.memoryStoreManager.get({
        type: 'interviewHistory',
        id: data.interviewId,
      }),
    ]);
    if (!interviewPaper || !interviewHistory) {
      throw new FinishInterviewException(400, 'interview is not initialized.', {
        id: data.interviewId,
      });
    }
    if (interviewPaper.items.filter((each) => each.isCompleted === false).length) {
      throw new FinishInterviewException(400, 'interview is not finished.', {
        id: data.interviewId,
      });
    }

    if (interviewPaper.finalOneLineReview) {
      return {
        interviewHistory,
        interviewPaper: interviewPaper as typeof finalInterviewPaper,
      };
    }

    interviewPaper.items = await this.refactorItems(interviewPaper.items, interviewHistory);

    const [itemResult, finalResult] = await Promise.all([
      this.generateItemEvaluation(interviewPaper.items),
      this.generateFinalEvaluation(interviewPaper.items),
    ]);

    const finalInterviewPaper = {
      ...itemResult,
      ...finalResult,
    } satisfies typeof interviewPaper;

    await this.memoryStoreManager.set({
      type: 'interviewPaper',
      id: data.interviewId,
      value: finalInterviewPaper,
    });

    this.notifyEvaluationFinished(data.interviewId);

    return {
      interviewHistory,
      interviewPaper: finalInterviewPaper,
    };
  }

  private async refactorItems<T extends { question: string }>(
    interviewItems: T[],
    interviewHistory: string[],
  ) {
    const prompt = `
###Role
I've organized the interview items based on the interview conversation history(web developer interview),
But I may have made mistakes (chronological order, reversed interviewer and applicant, contain typos etc...), 
Refactor my interview items below based on interview converstaion history using Korean.

###InterviewItem
It is kind of summary of interview. interview item has the following properties.

type InterviewItem = {
  question: string; // The questions asked by the interviewer.
  answer: string; // The applicant's answer.
  tailQuestions: { // Additional questions the interviewer asked.
    question: string;
    answer: string;
  }[];
  isCompleted: boolean, // Indicates whether this topic is completed.
}

###My Inteview Items:
 ${JSON.stringify(interviewItems)}

 ###Converstaion history: 
${JSON.stringify(interviewHistory)}

###Response Example:
Please follow this JSON format for your response.
{
  "items": [{}] // refactored items based on full converstaion history
}

###Steps for Response
- Fix any typos in the applicant's answers.
- If there are any mismatches between the conversation history and the interview items, please correct them.
`.trim();

    return this.llmManager
      .predict<{
        items: {
          question: string;
          answer: string;
          tailQuestions: {
            question: string;
            answer: string;
          }[];
          isCompleted: boolean;
        }[];
      }>(prompt)
      .then((res) => res.items);
  }

  private async generateItemEvaluation<T extends { question: string }>(interviewItems: T[]) {
    const prompt = `
###Role
You are a senior developer evaluating interview applicants' answers.
Look at the interview items below and give them a score with comment in Korean.

###InterviewItem
type InterviewItem = {
    question: string; // The questions asked by the interviewer
    answer: string; // The applicant's answer.
    evaluation: { // This is what you must update.
      comment: string; // As much detail as possible
      score: number; // Out of 100, an 70 or higher is a passing score.
    };
    tailQuestions: { // Additional questions the interviewer asked. (Don't remove tailQuestion elements!)
      question: string;
      answer: string;
      evaluation: { // This is what you must update.
        comment: string; // As much detail as possible
        score: number; // Out of 100, an 70 or higher is a passing score.
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
- If applicant said they don't know or answered incorrectly, then score less than 10.
- Don't remove tailQuestion elements.
`.trim();

    return this.llmManager.predict<{
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
    }>(prompt);
  }

  private async generateFinalEvaluation<T extends { question: string }>(interviewItems: T[]) {
    const prompt = `
You are a senior developer evaluating interview applicants' answers.
Look at the interview items below and give final score & review in Korean.

###InterviewItems
${JSON.stringify(interviewItems)}

###Response Example:
Please follow this JSON format for your response.
{
  "finalOneLineReview": string; // A comprehensive one-line evaluation.
  "finalScore": number; // Out of 100, an 70 or higher is a passing score.
}
`.trim();

    return this.llmManager.predict<{
      finalOneLineReview: string;
      finalScore: number;
    }>(prompt);
  }

  private notifyEvaluationFinished(interviewId: number) {
    setTimeout(() => this.mainServerClient.finishInterview({ interviewId }), 1000);
  }
}
