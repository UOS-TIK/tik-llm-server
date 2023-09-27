import { Injectable, NotFoundException } from '@nestjs/common';
import { environment } from '@src/environment';
import { Redis } from 'ioredis';

type MemoryStoreItem = {
  interviewPaper: {
    question: string;
    answer: string;
    tailQuestions: {
      question: string;
      answer: string;
    }[];
    isCompleted: boolean;
    evaluation?: {
      comment: string;
      score: number;
    };
  }[];

  interviewHistory: string[];
};

@Injectable()
export class MemoryStoreManager {
  private redisClient = new Redis({
    host: environment.redis.host,
    port: environment.redis.port,
  });

  async get<T extends keyof MemoryStoreItem>(params: { type: T; id: string | number }) {
    const key = `${params.type}-${params.id}`;
    const value = await this.redisClient.get(key);
    if (!value) {
      throw new NotFoundException(`not found redis item. key=${key}`);
    }

    return JSON.parse(value) as MemoryStoreItem[T];
  }

  async set<T extends keyof MemoryStoreItem>(params: {
    type: T;
    id: string | number;
    value: MemoryStoreItem[T];
    ttl?: number;
  }) {
    const key = `${params.type}-${params.id}`;

    return this.redisClient.set(key, JSON.stringify(params.value), 'EX', params.ttl || 3 * 60 * 60);
  }
}
