import { AppException, InterviewLockException } from '@src/common';

export interface InitInterviewData {
  interviewId: number;
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
  'interview is already started.' | InterviewLockException['message']
> {}
