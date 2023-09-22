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

    const itemIndex = interviewPaper.findIndex((each) => each.isCompleted === false);
    const currInterviewItem = interviewPaper[itemIndex];
    const nextInterviewItem = interviewPaper[itemIndex + 1] ?? null;
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

    interviewPaper[itemIndex] = result.currInterviewItem;

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

###면접 질문항목(InterviewItem):
1. currInterviewItem
- 현재 대화 중인 면접 질문 및 평가 정보입니다.
- 대화를 통해 currInterviewItem을 채우는 것이 목표입니다.
- 적절한 추가 질문(tailQuestion)을 통해 깊이있는 면접을 진행하세요.
- 적절한 tailQuestion이 없거나 이 주제로 충분히 대화를 나누었다면 isCompleted를 true로 변경해주세요.
**currInterviewItem: ${JSON.stringify(params.currInterviewItem)}

2. nextInterviewItem
- 현재 주제에 대한 대화를 마무리할때, 이어나갈 질문 정보입니다.
- nextInterviewItem은 currInterviewItem가 completed 됐을때 다음 질문을 위한 주제로 이용해주세요.(이때 만약 nextInterviewItem가 null이라면 면접을 종료해주세요)
**nextInterviewItem: ${JSON.stringify(params.nextInterviewItem)}

3. InterviewItem의 property에 대한 설명입니다.
type InterviewItem = {
  question: string; // 면접관이 해야할 질문입니다.
  answer: string; // 지원자의 답변입니다.
  comment: string; // 지원자의 답변에 대한 면접관의 평가 및 피드백입니다.(최대한 자세히 작성해주세요)
  score: number; // 지원자의 답변에 대한 점수입니다. (10점 만점이며, 0점이면 아직 평가전입니다)
  tailQuestions: { // 지원자의 답변을 듣고 추가로 하고 싶은 질문이 있다면 추가해주세요. (먼저한 질문이 앞에 있도록 순서를 유지해주세요)
    question: string;
    answer: string;
    comment: string;
    score: number;
  }[];
  isCompleted: boolean // 기본값은 false이며, 더 이상 해당 질문의 꼬리 질문(tailQuestions)이 없고 현재 주제에 대한 대화를 끝내고 싶다면 true로 변경해주세요.
};

###이전 대화 기록(최근 4개):
${JSON.stringify(params.interviewHistory.slice(-5, -1))}

###현재 대화 내용:
**면접관이 한말
${params.interviewHistory.slice(-1)}

**지원자가 한말:
${params.message}


###응답 예시:
응답은 아래 JSON 양식을 따라 주세요.
1. currInterviewItem: (필수)
- 적절하게 currInterviewItem의 항목을 업데이트 해주세요.
- isCompleted가 true이고 nextInterviewItem이 null이라면 면접을 마무리하고 지원자에게 면접 종료를 안내해주세요.

2. reply: (필수)
- 현재 대화 내용의 지원자가 한말에 적절한 대답을 해주세요.
- 면접의 진행을 위해 현재 주제(currInterviewItem)에 대한 추가 질문(tailQuestions)을 하거나 현재 주제를 마무리하고 다음 주제에 대해 질문을 해주세요.
- 만약, isCompleted가 true이고 다음 주제가 null이라면 면접을 마무리하고 지원자에게 면접 종료를 안내해주세요.

{
  "currInterviewItem": {}, 
  "reply": ""
}
`.trim();
  }
}
