import { AppException, LockInterviewException } from '@src/common';

export interface FinishInterviewData {
  interviewId: number;
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
  'interview is not finished.' | LockInterviewException['message']
> {}
