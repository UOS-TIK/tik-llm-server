import { MemoryStoreManager } from '@src/secondary';
import { Aspect, createDecorator, LazyDecorator, WrapParams } from '@toss/nestjs-aop';
import { AppException } from './all-exception.filter';

const LockInterviewSymbol = Symbol('LockInterviewSymbol');

@Aspect(LockInterviewSymbol)
export class LockInterviewAspect implements LazyDecorator {
  constructor(private readonly memoryStoreManager: MemoryStoreManager) {}

  wrap({ method, metadata: ttl }: WrapParams<(...params: any[]) => Promise<unknown>, number>) {
    return async (...params: any[]) => {
      const interviewId = params[0].interviewId;
      if (!interviewId) {
        throw new LockInterviewException(400, `invalid interviewId.`, { id: interviewId });
      }

      await this.memoryStoreManager
        .get({
          type: 'interviewLock',
          id: interviewId,
        })
        .catch(() => true)
        .then((interviewLock) => {
          if (!interviewLock) {
            throw new LockInterviewException(400, `interview is locked.`, { id: interviewId });
          }
        });

      return this.memoryStoreManager
        .set({
          type: 'interviewLock',
          id: interviewId,
          value: false,
          ttl,
        })
        .then(() => method(...params))
        .finally(() =>
          this.memoryStoreManager.set({
            type: 'interviewLock',
            id: interviewId,
            value: true,
            ttl,
          }),
        );
    };
  }
}

export const LockInterview = (ttl = 300) => createDecorator(LockInterviewSymbol, ttl);

export class LockInterviewException extends AppException<
  'invalid interviewId.' | 'interview is locked.'
> {}
