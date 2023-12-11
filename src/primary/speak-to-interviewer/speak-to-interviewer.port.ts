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
  private tailQuestionCount = 2;

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
    // TODO: 지우기
    if (data.message === '지금부터 면접을 시작하겠습니다.') {
      data.message = '네 잘 부탁드립니다.';
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
        currInterviewItem: updatedCurrInterviewItem,
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
- answer: string; // The applicant's answer. "" means the applicant hasn't answered yet or invalid.
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
- Do not create new tailQuestion item. just update answer of tailQuestion.
- Before update answer check if answer is valid, if it is not then answer should be "".
- View your recent conversations to see if the applicant answered your unanswered question.
- If they did, edit the answer to that question.
- If the applicant says they don't know, record their answer.
- If you can't find proper answer, answer should be "".
- If the applicant asks to confirm the interviewer's question, answer should be "". (**this is very important!)
    example1) 
      Recent conversations:
      [
        ...
        "면접관: gRPC를 사용하여 서버 간 통신 효율을 높이는 방안을 말씀해주셨는데, 이러한 성능 최적화 기법을 적용할 때 네트워크 통신 외에 발생할 수 있는 다른 잠재적인 문제에 대해 어떻게 대응할 수 있는지 예를 들어 설명해주실 수 있나요?",
        "지원자: 다른 잠재적인 문제가 생각이 잘 나지 않습니다. 혹시 어떤 문제가 있는지 알려주실 수 있을까요?", // applicant asks to confirm about question, so answer should be ""
      ]	    

      Response:
      {
        "question": "이러한 성능 최적화 기법을 적용할 때 네트워크 통신 외에 발생할 수 있는 다른 잠재적인 문제에 대해 어떻게 대응할 수 있는지 예를 들어 설명해주실 수 있나요?",
        "answer": "" // answer should be "". 
      }

    example2) 
      Recent conversations:
      [
        ...
        "면접관: RDBMS와 NoSQL을 사용하는 경우에 대해 여쭤보겠습니다. RDBMS와 NoSQL을 각각 어떤 상황에서 선호하는지, 그리고 이유에 대해 설명해주시겠어요?",
        "지원자: rdbms라고 하면 관계형 데이터베이스를 말씀하시는 걸로 맞을까요?" // applicant asks to confirm about question, so answer should be ""
      ]	    

      Response:
      {
        "question": "당사의 백엔드 서비스 개발에 있어서 RDBMS와 NoSQL을 사용하는 경우가 다를 텐데, 어떤 상황에서 각각을 선호하시며, 그 이유는 무엇인가요?",
        "answer": ""  // answer should be "". 
      }

    example3)
      Recent conversations:
      [
        ...
        "면접관: Node.js와 Typescript를 사용하여 대규모 트래픽을 처리하는 서비스를 설계하고 구축할 때, 어떤 보안적인 측면을 고려해야 한다고 생각하십니까?",
        "지원자: 질문이 조금 명확하지 않은데, 구체적인 예시 들어주실 수 있을까요?" // applicant asks to confirm about question, so answer should be ""
      ]
      
      Response:
      {
        "question": "Node.js와 Typescript를 사용하여 대규모 트래픽을 처리하는 서비스를 설계하고 구축할 때, 어떤 보안적인 측면을 고려해야 한다고 생각하십니까?",
        "answer": ""  // answer should be "". 
      }
`.trim();

    return this.llmManager.predict<{ currInterviewItem: T }>(prompt, { version: 3 });
  }

  private generateTailQuestion<T extends { question: string }>(params: {
    currInterviewItem: T;
    recentConversations: string[];
  }) {
    const prompt = `
### Role:
You are a senior developer conducting a technical interview.(=interviewer)
Create a new tail question to the rootQuestion in Korean using below information.

### Interview Item:
An interview item has the following properties
- question: string; // A question for the interviewer to ask.
- answer: string; // The applicant's answer.
- tailQuestions: { // Follow-up questions to the rootQuestion.
    question: string; 
    answer: string;
  }[];

### Current interview item:
${JSON.stringify(params.currInterviewItem)}

### Recent converations:
${JSON.stringify(params.recentConversations)}

### Example response:
The response should follow the following JSON format.
{
  "tailQuestion": string
}

### Steps for response
- Consider current interview item's question.
- Consider the applicant's answer.
- Do not create same question again which already exist in current interview item's tailQuestion.
- Maximum tail question count is ${this.tailQuestionCount}. consider it to create best tailQuestion.
`.trim();

    return this.llmManager.predict<{ tailQuestion: string }>(prompt, { version: 4 });
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
- Do not add prefix like '면접관: '.
- Do not repeat same reply based on Recent conversations.
- If the applicant asks to confirm the previous question, should include answer about it in reply.
`.trim();

    return this.llmManager.predict<{ reply: string }>(prompt, { version: 3 });
  }
}
