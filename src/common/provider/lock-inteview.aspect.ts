import { MemoryStoreManager } from '@src/secondary';
import { Aspect, createDecorator, LazyDecorator, WrapParams } from '@toss/nestjs-aop';
import { AppException } from '../exception';

const LockInterviewSymbol = Symbol('LockInterviewSymbol');

@Aspect(LockInterviewSymbol)
export class LockInterviewAspect implements LazyDecorator {
  constructor(private readonly memoryStoreManager: MemoryStoreManager) {}

  wrap({
    method,
    metadata: [ttl, timeout],
  }: WrapParams<(...params: any[]) => Promise<unknown>, [number, number]>) {
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
        .then((interviewLock) => {
          if (interviewLock === false) {
            throw new LockInterviewException(400, `interview is locked.`, { id: interviewId });
          }
        });

      return new Promise(async (resolve, reject) => {
        const timeoutId = timeout
          ? setTimeout(
              () =>
                reject(
                  new LockInterviewException(400, `interview is locked.`, { id: interviewId }),
                ),
              timeout * 1000,
            )
          : null;

        return this.memoryStoreManager
          .set({
            type: 'interviewLock',
            id: interviewId,
            value: false,
            ttl,
          })
          .then(() => method(...params))
          .then((result) => {
            if (timeoutId) clearTimeout(timeoutId);
            resolve(result);
          })
          .catch((err) => {
            if (timeoutId) clearTimeout(timeoutId);
            reject(err);
          })
          .finally(() => {
            this.memoryStoreManager.set({
              type: 'interviewLock',
              id: interviewId,
              value: true,
              ttl,
            });
          });
      });
    };
  }
}

export const LockInterview = (ttl = 300, timeout = 0) =>
  createDecorator(LockInterviewSymbol, [ttl, timeout]);

export class LockInterviewException extends AppException<
  'invalid interviewId.' | 'interview is locked.'
> {}
