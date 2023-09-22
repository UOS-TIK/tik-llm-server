import { Injectable } from '@nestjs/common';
import { LlmManager, MemoryStoreManager } from '@src/secondary';
import { InitInterviewData, InitInterviewView } from './init-interview.data';

@Injectable()
export class InitInterviewPort {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly memoryStoreManager: MemoryStoreManager,
  ) {}

  async execute(data: InitInterviewData): Promise<InitInterviewView> {
    const result = await this.llmManager.predict<{
      keywords: string[];
      questions: string[];
    }>(this.buildPrompt(data));

    await this.memoryStoreManager.set({
      type: 'interviewPaper',
      id: data.id,
      value: result.questions.map((question) => ({
        question,
        answer: '',
        comment: '',
        score: 0,
        isCompleted: false,
        tailQuestions: [],
      })),
    });

    await this.memoryStoreManager.set({
      type: 'interviewHistory',
      id: data.id,
      value: [
        '면접관: 안녕하세요. 먼저, 저희 회사에 지원해주셔서 감사드리며 오늘 면접 잘 부탁드리겠습니다.',
      ],
    });

    return { questions: result.questions };
  }

  private buildPrompt(params: InitInterviewData) {
    return `
###역할: 
당신은 기술 면접을 준비하는 시니어 개발자입니다.
아래 주어진 지원자의 개발스택, 직무 설명서를 참고하여 면접 질문지를 작성하세요.

###지원자의 개발스택:
${params.techStack.join(', ')}

###직무 설명서:
${params.jobDescription.join(',')}

###응답 예시:
응답은 아래 JSON 양식을 따라 주세요.
1. keywords: 스프링부트, JPA, RDBMS, Javascript, React 등 복수 선택 가능합니다.
2. questions: 따로 묻고 싶은 질문 리스트입니다.

단, 다음의 사항을 지켜주세요. 
${params.options.join(', ')}

{
  "keywords": [""], 
  "questions": [""]
}
`.trim();
  }
}
