import { Injectable } from '@nestjs/common';
import { LockInterview } from '@src/common';
import { LlmManager, MemoryStoreManager } from '@src/secondary';
import {
  SpeakToInterviewerData,
  SpeakToInterviewerException,
  SpeakToInterviewerView,
} from './speak-to-interviewer.data';

@Injectable()
export class SpeakToInterviewerPort {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly memoryStoreManager: MemoryStoreManager,
  ) {}

  @LockInterview(300)
  async execute(data: SpeakToInterviewerData): Promise<SpeakToInterviewerView> {
    const [interviewPaper, interviewHistory] = await Promise.all([
      this.memoryStoreManager.get({
        type: 'interviewPaper',
        id: data.interviewId,
      }),
      this.memoryStoreManager.get({
        type: 'interviewHistory',
        id: data.interviewId,
      }),
    ]);
    if (!interviewPaper || !interviewHistory) {
      throw new SpeakToInterviewerException(400, 'interview is not initialized.', {
        id: data.interviewId,
      });
    }

    const currItemIndex = interviewPaper.items.findIndex((each) => each.isCompleted === false);
    const currInterviewItem = interviewPaper.items[currItemIndex];
    const nextInterviewItem = interviewPaper.items[currItemIndex + 1] ?? null;
    if (!currInterviewItem) {
      throw new SpeakToInterviewerException(400, 'interview is finished.', {
        id: data.interviewId,
      });
    }

    const result = await this.generateResponse({
      currInterviewItem,
      nextInterviewItem,
      recentConversations: [
        ...interviewHistory.slice(-3),
        `applicant(latest answer): ${data.message}`,
      ],
    });

    interviewPaper.items[currItemIndex] = result.currInterviewItem;

    await Promise.all([
      this.memoryStoreManager.set({
        type: 'interviewPaper',
        id: data.interviewId,
        value: interviewPaper,
      }),
      this.memoryStoreManager.set({
        type: 'interviewHistory',
        id: data.interviewId,
        value: [
          ...interviewHistory,
          `applicant: ${data.message}`,
          `you(interviewer): ${result.reply}`,
        ],
      }),
    ]);

    return {
      reply: result.reply,
      isFinished: !nextInterviewItem && result.currInterviewItem.isCompleted,
    };
  }

  private async generateResponse<T extends { question: string }>(params: {
    currInterviewItem: T;
    nextInterviewItem: T | null;
    recentConversations: string[];
  }) {
    const prompt = `
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
${JSON.stringify(params.currInterviewItem)}

###Next Interview Item:
${JSON.stringify(params.nextInterviewItem)}

###Recent Conversations:
${JSON.stringify(params.recentConversations)}

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
`.trim();

    return this.llmManager.predict<{
      currInterviewItem: typeof params.currInterviewItem;
      reply: string;
    }>(prompt, { version: 3 });
  }
}
