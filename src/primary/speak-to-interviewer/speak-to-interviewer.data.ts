import { AppException, LockInterviewException } from '@src/common';

export interface SpeakToInterviewerData {
  interviewId: number;
  message: string;
}

export interface SpeakToInterviewerView {
  reply: string;
}

export class SpeakToInterviewerException extends AppException<
  'interview is not initialized.' | 'interview is finished.' | LockInterviewException['message']
> {}
