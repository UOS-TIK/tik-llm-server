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

  @LockInterview(400)
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

    const recentConversations = [
      ...interviewHistory.slice(-3),
      `지원자(마지막 답변): ${data.message}`,
    ];

    const { currInterviewItem: updatedCurrInterviewItem } = await this.generateCurrInterviewItem({
      currInterviewItem,
      recentConversations,
    });

    const currentTopic = !updatedCurrInterviewItem.answer
      ? updatedCurrInterviewItem.question
      : updatedCurrInterviewItem.tailQuestions.find((each) => !each.answer)?.question ||
        nextInterviewItem?.question;

    const { reply } = await this.generateReply({
      currentTopic,
      recentConversations,
    });

    updatedCurrInterviewItem.isCompleted = currentTopic === nextInterviewItem?.question;

    interviewPaper.items[currItemIndex] = updatedCurrInterviewItem;

    await Promise.all([
      this.memoryStoreManager.set({
        type: 'interviewPaper',
        id: data.interviewId,
        value: interviewPaper,
      }),
      this.memoryStoreManager.set({
        type: 'interviewHistory',
        id: data.interviewId,
        value: [...interviewHistory, `지원자: ${data.message}`, `면접관: ${reply}`],
      }),
    ]);

    return {
      reply,
      isFinished: !currentTopic,
    };
  }

  private async generateCurrInterviewItem<T extends { question: string }>(params: {
    currInterviewItem: T;
    recentConversations: string[];
  }) {
    const prompt = `
### Role:
You are a senior developer conducting a technical interview.(=interviewer)
Update the content of your current interview item based on a recent conversation.

### Interview Item:
An interview item has the following properties
- question: string; // A question for the interviewer to ask.
- answer: string; // The candidate's answer. '' means the candidate hasn't answered yet.
- tailQuestions: { // Follow-up questions to the rootQuestion. tailQuestion doesn't have tailQuestion.
    question: string; 
    answer: string;
  }[];

### Current interview item:
${JSON.stringify(params.currInterviewItem)}

### Recent conversations:
${JSON.stringify(params.recentConversations)}

### Example response:
The response should follow the following JSON format.
{
  "currInterviewItem": {} // Update the content of your current interview item based on a recent conversation.
}

### Steps for Response
1. answer (include tailQuestion's answer)
- Refer to recent conversations, Edit answer to the applicable questions.
- If you can't find the applicant's answer in recent conversations, return ''.

2. tailQuestion
- Add follow-up questions based on the rootQuesetion of the current interview item and the applicant's answer.
- tailQuestion doesn't have tailQuestion.
- If you don't find a root question's answer, Don't create a new tailQuestion.
- Make sure you don't have more than 2 follow-up questions.
`.trim();

    return this.llmManager.predict<{
      currInterviewItem: typeof params.currInterviewItem;
    }>(prompt, { version: 4 });
  }

  private async generateReply(params: {
    currentTopic: string | undefined;
    recentConversations: string[];
  }) {
    if (!params.currentTopic) {
      return {
        reply: '네 답변 감사합니다. 그럼 이상으로 면접을 종료하겠습니다. 감사합니다.',
      };
    }

    const prompt = `
### Role:
You are a senior developer conducting a technical interview.(=interviewer)
Take a look at the current interview items and recent conversations below and respond appropriately to the candidate in Korean.

### Questions to ask:
${params.currentTopic}

### Recent conversations:
${JSON.stringify(params.recentConversations)}

### Example response:
The response should follow the following JSON format.
{
  "reply": "" // What you're going to say next. Proceed with the interview by asking about the questions you're going to ask.
}

### A word of caution
- Don't repeat same question.
- If the applicant can't answer or answers incorrectly, move on to the next question.
`.trim();

    return this.llmManager.predict<{
      reply: string;
    }>(prompt, { version: 3 });
  }
}
