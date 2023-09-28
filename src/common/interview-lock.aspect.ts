import { BadRequestException } from '@nestjs/common';
import { MemoryStoreManager } from '@src/secondary';
import { Aspect, createDecorator, LazyDecorator, WrapParams } from '@toss/nestjs-aop';

const InterviewLockSymbol = Symbol('InterviewLock');

@Aspect(InterviewLockSymbol)
export class InterviewLockAspect implements LazyDecorator {
  constructor(private readonly memoryStoreManager: MemoryStoreManager) {}

  wrap({ method, metadata: ttl }: WrapParams<any, number>) {
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

      await this.memoryStoreManager.set({
        type: 'interviewLock',
        id: interviewId,
        value: false,
        ttl,
      });
      console.log(ttl);

      const res = await method(...params);

      await this.memoryStoreManager.set({
        type: 'interviewLock',
        id: interviewId,
        value: true,
        ttl,
      });

      return res;
    };
  }
}

export const InterviewLock = (ttl = 300) => createDecorator(InterviewLockSymbol, ttl);
