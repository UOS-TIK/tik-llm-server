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

    const recentConversations = [...interviewHistory.slice(-2), `지원자: ${data.message}`];
    const currItemIndex = interviewPaper.items.findIndex((each) => each.isCompleted === false);
    const currInterviewItem = interviewPaper.items[currItemIndex];
    const nextInterviewItem = interviewPaper.items[currItemIndex + 1] ?? null;
    if (!currInterviewItem) {
      throw new SpeakToInterviewerException(400, 'interview is finished.', {
        id: data.interviewId,
      });
    }

    const { reply } = await this.generateReply({
      currInterviewItem,
      nextInterviewItem,
      recentConversations,
    });

    recentConversations.push(`면접관: ${reply}`);

    const { currInterviewItem: updatedCurrInterviewItem } = await this.generateCurrInterviewItem({
      currInterviewItem,
      nextInterviewItem,
      recentConversations,
    });

    if (updatedCurrInterviewItem.tailQuestions.length < 2) {
      const { tailQuestion } = await this.generateTailQuestion({
        currQuestion: updatedCurrInterviewItem.question,
        recentConversations,
      });

      updatedCurrInterviewItem.tailQuestions.push({ question: tailQuestion, answer: '' });
    }

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
      isFinished: !nextInterviewItem && updatedCurrInterviewItem.isCompleted,
    };
  }

  private async generateReply<T extends { question: string }>(params: {
    currInterviewItem: T;
    nextInterviewItem: T | null;
    recentConversations: string[];
  }) {
    const prompt = `
### 역할:
당신은 기술 면접을 진행하는 시니어 개발자입니다.
아래 정보를 사용하여 한국어로 지원자에게 적절하게 답변하세요.

### 면접 항목:
면접 항목에는 다음과 같은 속성이 있습니다:
- question: string; // 면접관이 물어봐야 할 질문입니다.
- answer: string; // 지원자의 답변입니다. ''는 아직 답변하지 않은 상태를 의미합니다.
- tailQuestions: { // rootQuestion에 대한 후속 질문들입니다. 이들은 rootQuestion과 대화 맥락에 관련된 추가 질문이며, 별도의 주제로 분기되지 않습니다.
    question: string;
    answer: string;
}[];
- isCompleted: boolean; // 해당 주제에 대한 논의가 완료되었는지를 나타냅니다.

### 현재 면접 항목:
${JSON.stringify(params.currInterviewItem)}

### 다음 면접 항목:
${JSON.stringify(params.nextInterviewItem)}

### 최근 대화:
${JSON.stringify(params.recentConversations)}

### 응답 주의 사항
- tailQuestion을 포함해서, answer === ''인 항목에 대해 질문하세요.
- answer === ''인 항목이 없다면, *다음 면접 항목*에 대해 질문하세요.
- 더 이상 추가로 질문할 항목이 없고, *다음 면접 항목* === null이라면 면접 종료를 안내하세요.
- 반드시 같은 질문을 반복하지 마세요!
- *현재 면접 항목* 혹은 *다음 면접 항목*에 없는 질문을 하지마세요!

### 응답 예시:
응답은 다음 JSON 형식을 따라야 합니다.
{
  "reply": "" // 당신이 다음에 할 말입니다.
}

### Notice
- tailQuestion을 포함해서, answer === ''인 항목에 대해 질문하세요.
- answer === ''인 항목이 없다면, *다음 면접 항목*에 대해 질문하세요.
- 더 이상 추가로 질문할 항목이 없고, *다음 면접 항목* === null이라면 면접 종료를 안내하세요.
- 반드시 같은 질문을 반복하지 마세요!
- *현재 면접 항목* 혹은 *다음 면접 항목*에 없는 질문을 하지마세요!
`.trim();

    return this.llmManager.predict<{
      reply: string;
    }>(prompt, { version: 4 });
  }

  private async generateCurrInterviewItem<T extends { question: string }>(params: {
    currInterviewItem: T;
    nextInterviewItem: T | null;
    recentConversations: string[];
  }) {
    const prompt = `
### 역할:
당신은 기술 면접을 진행하는 시니어 개발자입니다.
최근 대화를 기반으로 현재 면접 항목의 answer과 isCompleted를 업데이트히세요.

### 면접 항목:
면접 항목에는 다음과 같은 속성이 있습니다:
- question: string; // 면접관이 해야할 질문입니다.
- answer: string; // 지원자의 답변입니다. ''는 지원자가 아직 답변하지 않은 상태를 의미합니다.
- tailQuestions: { // rootQuestion에 대한 후속 질문들입니다. 이들은 rootQuestion과 대화 맥락에 관련된 추가 질문이며, 별도의 주제로 분기되지 않습니다.
    question: string; 
    answer: string;
}[];
- isCompleted: boolean; // 해당 주제에 대한 논의가 완료되었는지를 나타냅니다. 


### 현재 면접 항목:
${JSON.stringify(params.currInterviewItem)}

### 다음 면접 항목:
${JSON.stringify(params.nextInterviewItem)}

### 최근 대화:
${JSON.stringify(params.recentConversations)}

### 응답 주의 사항
1. answer
- tailQuestion 하위의 answer도 포함합니다.
- 최근 대화를 참고하여 지원자가 한 말을 작성하세요.
- 최근 대화에서 지원자의 답변을 찾을수 없다면 ''을 리턴하세요.

2. isCompleted
- 최근 대화를 참고하여 현재 면접 항목에 대한 논의가 완료되었다면 true로 설정하세요
- 최근 대화를 참고하여 면접관이 면접 종료를 안내했다면 true로 설정하세요.
- 그 밖에는 false로 설정하세요.

### 응답 예시:
응답은 다음 JSON 형식을 따라야 합니다.
{
  "currInterviewItem": {} // 반드시 유효한 JSON 포맷을 지켜주세요
}

### Notice
1. answer
- tailQuestion 하위의 answer도 포함합니다.
- 최근 대화를 참고하여 지원자가 한 말을 작성하세요.
- 최근 대화에서 지원자의 답변을 찾을수 없다면 ''을 리턴하세요.

2. isCompleted
- 최근 대화를 참고하여 현재 면접 항목에 대한 논의가 완료되었다면 true로 설정하세요
- 최근 대화를 참고하여 면접관이 면접 종료를 안내했다면 true로 설정하세요.
- 그 밖에는 false로 설정하세요.
`.trim();

    return this.llmManager.predict<{
      currInterviewItem: typeof params.currInterviewItem;
    }>(prompt, { version: 3 });
  }

  private async generateTailQuestion(params: {
    currQuestion: string;
    recentConversations: string[];
  }) {
    const prompt = `
### 역할:
당신은 기술 면접을 진행하는 시니어 개발자입니다.
아래 정보를 사용하여 한국어로 적절한 후속 질문을 생성해주세요.

### 현재 대화 주제:
${JSON.stringify(params.currQuestion)}

### 최근 대화:
${JSON.stringify(params.recentConversations)}

### 응답 예시:
응답은 다음 JSON 형식을 따라야 합니다.
{
  "tailQuestion": "" 
}

- 현재 대화 주제와 지원자의 답변을 기반으로 후속 질문을 생성해주세요.
`.trim();

    return this.llmManager.predict<{
      tailQuestion: string;
    }>(prompt, { version: 3 });
  }
}
