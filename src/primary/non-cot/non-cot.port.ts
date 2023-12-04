import { Injectable } from '@nestjs/common';
import { LlmManager, MemoryStoreManager } from '@src/secondary';
import { NonCotData, NonCotView } from './non-cot.data';

@Injectable()
export class NonCotPort {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly memoryStoreManager: MemoryStoreManager,
  ) {}

  async execute(params: NonCotData): Promise<NonCotView> {
    const interviewHistory = await this.memoryStoreManager.get({
      id: params.interviewId,
      type: 'interviewHistory',
    });

    const res = await this.llmManager.predict<{
      currQuestionIndex: number;
      reply: string;
    }>(
      `
###Role:
You are a senior developer conducting a technical interview.
Use the information given below to conduct the interview in Korean

###Applicant's Resume:
${JSON.stringify(params.techStack)}

###Company's Job Description:
${JSON.stringify(params.jobDescription)}

###Recent Conversations:
${JSON.stringify(interviewHistory)}

###Response Example:
Please follow this JSON format for your response
{
  "currQuestionIndex: 1, // if you ask new question add + 1
  "reply": ""
}
`.trim(),
    );
    console.log(res);

    return { id: 1 };
  }
}
