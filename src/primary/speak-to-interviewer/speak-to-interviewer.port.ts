import { BadRequestException, Injectable } from '@nestjs/common';
import { LlmManager, MemoryStoreManager } from '@src/secondary';
import { SpeakToInterviewerData, SpeakToInterviewerView } from './speak-to-interviewer.data';

@Injectable()
export class SpeakToInterviewerPort {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly memoryStoreManager: MemoryStoreManager,
  ) {}

  async execute(data: SpeakToInterviewerData): Promise<SpeakToInterviewerView> {
    const interviewPaper = await this.memoryStoreManager
      .get({
        type: 'interviewPaper',
        id: data.interviewId,
      })
      .catch(() => {
        throw new BadRequestException(`interview is not initialized. id=${data.interviewId}`);
      });

    const currItemIndex = interviewPaper.findIndex((each) => each.isCompleted === false);
    const currInterviewItem = interviewPaper[currItemIndex];
    const nextInterviewItem = interviewPaper[currItemIndex + 1] ?? null;
    if (!currInterviewItem) {
      throw new BadRequestException(`interview is finished. id=${data.interviewId}`);
    }

    const interviewHistory = await this.memoryStoreManager.get({
      type: 'interviewHistory',
      id: data.interviewId,
    });

    const result = await this.llmManager.predict<{
      currInterviewItem: typeof currInterviewItem;
      reply: string;
    }>(
      this.buildPrompt({
        currInterviewItem,
        nextInterviewItem,
        interviewHistory,
        message: data.message,
      }),
    );

    interviewPaper[currItemIndex] = result.currInterviewItem;

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

  private buildPrompt<T extends { question: string }>(params: {
    currInterviewItem: T;
    nextInterviewItem: T | null;
    interviewHistory: string[];
    message: string;
  }) {
    return `
###역할: 
당신은 기술 면접을 진행중인 시니어 개발자입니다.
아래 주어진 정보를 이용하여 자연스럽게 면접을 진행해주세요.

###면접 질문 주제(InterviewItem):
type InterviewItem = {
  question: string; // 면접관이 해야할 질문입니다.
  answer: string; // 지원자의 답변입니다.
  comment: string; // 지원자의 답변에 대한 면접관의 평가 및 피드백입니다.
  score: number; // 지원자의 답변에 대한 점수입니다.(10점 만점이며, 0점이면 아직 평가전입니다)
  tailQuestions: { // 지원자의 답변을 듣고 추가로 묻고 싶은 질문이 있다면 추가해주세요.
    question: string;
    answer: string;
    comment: string;
    score: number;
  }[];
  isCompleted: boolean // 해당 주제가 완료되었는지 여부입니다. 더 이상 필요한 꼬리 질문(tailQuestions)이 없고, 현재 주제에 대한 대화를 끝내고 다음 주제로 넘어가고 싶다면 true로 변경해주세요.
};

###현재 면접 질문 주제(CurrInterviewItem):
- 현재 대화 중인 주제, 질문 및 평가 정보입니다.
- 지원자와의 대화를 통해 currInterviewItem의 비어있는 항목을 채우는 것이 첫번쨰 당신의 목표입니다.

**currInterviewItem: 
${JSON.stringify(params.currInterviewItem)}

###다음 면접 질문 주제(NextInterviewItem):
- 현재 대화 중인 주제를 마무리 했을때 이어서 질문할 주제입니다.
- currInterviewItem의 isCompleted가 true가 됐을때 nextInterviewItem의 question을 이용해 질문을 이어나가세요.(단, nextInterviewItem이 null이라면 면접을 마무리하고 면접 종료를 안내하세요!)

**nextInterviewItem:
${JSON.stringify(params.nextInterviewItem)}

###현재 대화 내용:
- 전체 맥락을 고려해 지원자가 마지막으로 한 말에 적절한 답변을 하는것이 당신의 두번째 목표입니다.

**messages: 
${[...params.interviewHistory.slice(-5), `지원자가 마지막으로 한말: ${params.message}`].join('\n')}

###응답 예시:
응답은 아래 JSON 양식을 따라 주세요.
1. currInterviewItem: (필수)
- 지원자가 마지막으로 한말을 보고 수정할 currInterviewItem 입니다. 적절하게 currInterviewItem의 항목을 업데이트 해주세요.
- 추가 질문(tailQuestion)을 통해 깊이 있는 면접을 진행해주세요. 2~3개의 꼬리질문을 해주세요.
- 만약, isCompleted가 true이고 다음 주제(nextInterviewItem)가 null이라면 면접을 마무리하고 지원자에게 면접 종료를 안내해주세요.

2. reply: (필수)
- 현재 대화 내용의 지원자가 마지막으로 한말에 해줄 대답입니다.
- 자연스러운 면접의 진행을 위해 현재 주제(currInterviewItem)에 대한 추가 질문(tailQuestions)을 하거나 현재 주제를 마무리하고 다음 주제에 대한 질문을 해주세요.
- 질문은 명확하게 하나씩만 해주세요.
- 만약, isCompleted가 true이고 다음 주제(nextInterviewItem)가 null이라면 면접을 마무리하고 지원자에게 면접 종료를 안내해주세요.

{
  "currInterviewItem": {}, 
  "reply": ""
}
`.trim();
  }
}
