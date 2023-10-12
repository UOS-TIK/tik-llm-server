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
    const interviewPaper = await this.memoryStoreManager
      .get({
        type: 'interviewPaper',
        id: data.interviewId,
      })
      .catch(() => {
        throw new SpeakToInterviewerException(400, 'interview is not initialized.', {
          id: data.interviewId,
        });
      });

    const currItemIndex = interviewPaper.items.findIndex((each) => each.isCompleted === false);
    const currInterviewItem = interviewPaper.items[currItemIndex];
    const nextInterviewItem = interviewPaper.items[currItemIndex + 1] ?? null;
    if (!currInterviewItem) {
      throw new SpeakToInterviewerException(400, 'interview is finished.', {
        id: data.interviewId,
      });
    }

    const interviewHistory = await this.memoryStoreManager.get({
      type: 'interviewHistory',
      id: data.interviewId,
    });

    const result = await this.generateResponse({
      currInterviewItem,
      nextInterviewItem,
      recentConversations: [...interviewHistory.slice(-5), `지원자(마지막 답변): ${data.message}`],
    });

    interviewPaper.items[currItemIndex] = result.currInterviewItem;

    await this.memoryStoreManager.set({
      type: 'interviewPaper',
      id: data.interviewId,
      value: interviewPaper,
    });

    await this.memoryStoreManager.set({
      type: 'interviewHistory',
      id: data.interviewId,
      value: [...interviewHistory, `지원자: ${data.message}`, `면접관: ${result.reply}`],
    });

    return { reply: result.reply };
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
  question: string; // The question to be asked by the interviewer.
  answer: string; // The applicant's answer.
  tailQuestions: { // Additional questions that the interviewer wants to ask based on the applicant's answer.
    question: string;
    answer: string;
  }[];
  isCompleted: boolean; // Indicates whether this topic is completed. If there are no more tail questions and you want to move on from the current topic, set it to true.
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
  "currInterviewItem": {},
  "reply": ""
}

1. currInterviewItem (required):
- Update Current Interview Item appropriately, taking into account the applicant's answers and the overall context.
- Aim to fill answer in all unanswered questions. (Make sure no questions go unanswered!)
- Conduct an in-depth interview by asking additional tail questions. Please ask 2~10 follow-up questions.
- Please ask one clear question at a time
- If isCompleted is true and nextInterviewItem is null, conclude the interview and provide closing remarks to inform the applicant.    

2. reply (required):
- Provide an appropriate response based on what was most recently said by the applicant in order to maintain a natural flow of conversation.
- Ask additional tail questions related to the current interview item or complete current interview item and ask a new question related to 'next interview item'.
- Always ask one question at a time!
- If isCompleted is true and nextInterviewItem is null, conclude the interview and provide closing remarks to inform the applicant.
`.trim();

    return this.llmManager.predict<{
      currInterviewItem: typeof params.currInterviewItem;
      reply: string;
    }>(prompt);
  }
}
