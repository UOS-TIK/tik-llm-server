import { AppException, LockInterviewException } from '@src/common';
import { tags } from 'typia';

export interface SpeakToInterviewerData {
  interviewId: number & tags.Type<'uint32'>;
  message: string;
}

export interface SpeakToInterviewerView {
  reply: string;
  isFinished: boolean;
}

export class SpeakToInterviewerException extends AppException<
  'interview is not initialized.' | 'interview is finished.' | LockInterviewException['message']
> {}
