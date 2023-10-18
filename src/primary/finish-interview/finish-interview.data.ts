import { AppException, LockInterviewException } from '@src/common';
import { tags } from 'typia';

export interface FinishInterviewData {
  interviewId: number & tags.Type<'uint32'>;
}

export interface FinishInterviewView {
  interviewHistory: string[];

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
    }[];
    finalOneLineReview: string;
    finalScore: number;
  };
}

export class FinishInterviewException extends AppException<
  'interview is not initialized.' | 'interview is not finished.' | LockInterviewException['message']
> {}
