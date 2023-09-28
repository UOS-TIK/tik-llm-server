import { BadRequestException } from '@nestjs/common';
import { MemoryStoreManager } from '@src/secondary';
import { Aspect, createDecorator, LazyDecorator, WrapParams } from '@toss/nestjs-aop';

const InterviewLockSymbol = Symbol('InterviewLock');

@Aspect(InterviewLockSymbol)
export class InterviewLockAspect implements LazyDecorator {
  constructor(private readonly memoryStoreManager: MemoryStoreManager) {}

  wrap({ method, metadata: ttl }: WrapParams<(...params: any[]) => Promise<unknown>, number>) {
    return async (...params: any[]) => {
      const interviewId = params[0].interviewId;
      if (!interviewId) {
        throw new BadRequestException(`invalid interviewId.`);
      }

      await this.memoryStoreManager
        .get({
          type: 'interviewLock',
          id: interviewId,
        })
        .catch(() => true)
        .then((interviewLock) => {
          if (!interviewLock) {
            throw new BadRequestException(`interview is locked. id=${interviewLock}`);
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

export const InterviewLock = (ttl = 300) => createDecorator(InterviewLockSymbol, ttl);
