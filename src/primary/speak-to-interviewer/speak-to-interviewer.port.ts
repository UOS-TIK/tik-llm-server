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
  private tailQuestionCount = 0;

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
      ...interviewHistory.slice(-5),
      `지원자(마지막 답변): ${data.message}`,
    ];

    const { currInterviewItem: updatedCurrInterviewItem } = await this.generateCurrInterviewItem({
      currInterviewItem,
      recentConversations,
    });

    let currentTopic: string | undefined = undefined;
    if (
      updatedCurrInterviewItem.answer &&
      updatedCurrInterviewItem.tailQuestions.length < this.tailQuestionCount &&
      updatedCurrInterviewItem.tailQuestions.every((each) => each.answer)
    ) {
      const { tailQuestion } = await this.generateTailQuestion({
        recentConversations,
      });

      updatedCurrInterviewItem.tailQuestions.push({ question: tailQuestion, answer: '' });

      currentTopic = tailQuestion;
    } else {
      currentTopic = !updatedCurrInterviewItem.answer
        ? updatedCurrInterviewItem.question
        : updatedCurrInterviewItem.tailQuestions.find((each) => !each.answer)?.question ||
          nextInterviewItem?.question;
    }

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
Update the content of current interview item's answer based on a recent conversation.

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
  "currInterviewItem": {} // Update the current interview item's answer based on a recent conversation.
}

### Steps for response
- Before update answer check if answer is proper, if it is not then answer should be ''. (which means not answered)
- View your recent conversations to see if the applicant answered your unanswered question.
- If they did, edit the answer to that question.
- If the applicant says they don't know, record their answer.
- If you can't find proper answer, don't edit answer.
- Before update answer check if answer is answer for question, if it is not Do not update answer!!
    ex) ask something, check previous question etc...  (something unrelated)
        like that "말씀하신 서버사이드렌더링이 SSR이죠?" or "다시 질문 부탁드립니다." => it is not proper answer, but a follow-up question to your previos question.
`.trim();

    return this.llmManager.predict<{ currInterviewItem: T }>(prompt, { version: 4 });
  }

  private generateTailQuestion(params: { recentConversations: string[] }) {
    const prompt = `
### Role:
You are a senior developer conducting a technical interview.(=interviewer)
Create a new tail question in Korean based on recent conversations

### Recent converations:
${JSON.stringify(params.recentConversations)}

### Example response:
The response should follow the following JSON format.
{
  "tailQuestion": string
}

### Steps for response
- Consider the answer to the rootQuestion and tailQuestion to generate appropriate additional questions.
- Max tailQuestion count is ${this.tailQuestionCount} consider it.
`.trim();

    return this.llmManager.predict<{ tailQuestion: string }>(prompt, { version: 3 });
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
respond appropriately to the applicant in Korean using below information.

### Questions to ask:
${params.currentTopic}

### Recent conversations:
${JSON.stringify(params.recentConversations)}

### Example response:
The response should follow the following JSON format.
{
  "reply": "" // What you're going to say next. Proceed with the interview by asking about the questions you're going to ask.
}

### Steps for response
- Exclude a reaction to the applicant's answer in reply like "네 ~에 대한 답변 잘 들었습니다."
- Generate reply using information above to progress interview.
`.trim();

    return this.llmManager.predict<{ reply: string }>(prompt, { version: 3 });
  }
}
