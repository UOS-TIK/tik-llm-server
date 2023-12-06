import { TypedParam, TypedRoute } from '@nestia/core';
import { Controller, Res } from '@nestjs/common';
import { Response } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { LlmManager, MemoryStoreManager } from '../secondary';

@Controller('/_')
export class InternalController {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly memoryStoreManager: MemoryStoreManager,
  ) {}

  /**
   * @internal
   */
  @TypedRoute.Get('/demo')
  async renderHtml(@Res() res: Response): Promise<void> {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(await readFile(join(__dirname, '../../index.html')));
  }

  @TypedRoute.Get('/test')
  async tsre(): Promise<Record<string, string>> {
    const res = await this.llmManager.predict<{
      prompt: string;
      feedback: string;
    }>(`
Refactor below prompt. 

If you need more parameters, then add.

---Prompt---
###Role:
You are a senior developer conducting a technical interview.
Use the information given below to conduct the interview in Korean

###Interview Item:
type InterviewItem = {
  question: string; // The question which you have to ask.
  answer: string; // The applicant's answer. '' means unawnswered yet.
  tailQuestions: { // Additional questions that you wants to ask. only rootQuestion has tailQuestion. tailQuestion doesn't have tailQuestion. 
    question: string;
    answer: string;
  }[];
  isCompleted: boolean; // Indicates whether this topic is completed. 
};

###Current Interview Item:
\${JSON.stringify(params.currInterviewItem)}\

###Next Interview Item:
\${JSON.stringify(params.nextInterviewItem)}\

###Recent Conversations:
\${JSON.stringify(params.recentConversations)}\

###Response Example:
Please follow this JSON format for your response
{
  "currInterviewItem": {}, // update question's answer based on conversation. and create or update tailQuestion if you want.
  "reply": "" // message which you say next. use it to ask question to applicant or conclude interview.
}

Let's make response step by step
### currInterviewItem
1. Update answer(include tailQuestion) property based on Recent Conversations. If applicant doesn't answer yet, do not update answer. Instead ask question to get answer using reply property 
2. Create new tailQuestion based on Recent Conversations. (If you want to ask new Qusetion, However tailQuestion's length must be 1~2)
3. Set isCompleted to true. If you've done to update all answers.

### reply
1. Select Question you want to ask include tailQuestion. and If you set isCompleted(in currInterviewItem) as true, then use Next Interview Item
2. If you set isCompleted(in currInterviewItem) as true and nextInterviewItem is null, conclude the interview. Must provide closing remarks to inform the applicant.
3. Ask question you select in step1 However, If isCompleted is true and nextInterviewItem is null, Must provide closing remarks to inform the applicant. (Do not ask new question!)


--- Response
follow this json format as response 
{
  prompt: "" // refactored prompt,
  feedback: "" // what you think about my prompt & improvements
}
`);

    return res;
  }
  /**
   * @internal
   */
  @TypedRoute.Get('/interview-paper/:id')
  async getInterviewPaper(@TypedParam('id') id: number): Promise<Record<string, any>> {
    await this.memoryStoreManager.set({
      id,
      type: 'interviewHistory',
      value: ['면접관: 자 그러면, 면접 시작하겠습니다.'],
    });
    await this.memoryStoreManager.set({
      id,
      type: 'interviewPaper',
      value: {
        items: [
          {
            question:
              'Next.js를 사용하여 서버 사이드 렌더링을 구현할 때, 클라이언트 사이드 렌더링과 비교했을 때의 성능상 이점과 주의해야 할 점에 대해 설명해주실 수 있나요?',
            answer: '',
            tailQuestions: [],
            isCompleted: false,
          },
        ],
        finalOneLineReview: '',
        finalScore: 0,
      },
    });
    return {
      interviewHistory: await this.memoryStoreManager.get({ type: 'interviewHistory', id }),
      interviewPaper: await this.memoryStoreManager.get({ type: 'interviewPaper', id }),
    };
  }
}
