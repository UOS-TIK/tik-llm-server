import { AppException, LockInterviewException } from '@src/common';
import { tags } from 'typia';

export interface InitInterviewData {
  interviewId: number & tags.ExclusiveMinimum<0>;
  techStack: string[];
  jobDescription: string[];
  options: {
    questionCount: number;
  };
}

export interface InitInterviewView {
  interviewId: number;
}

export class InitInterviewException extends AppException<
  'interview is already started.' | LockInterviewException['message']
> {}
