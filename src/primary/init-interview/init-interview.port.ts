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
###Role:
You are a senior developer preparing for a technical interview.
Please create the interview questionnaire in Korean using the information given below.

###Applicant's Tech Stack:
${params.techStack.join(', ')}

###Job Description:
${params.jobDescription.join(',')}

###Response Example:
Please follow this JSON format for your response
{
  "keywords": [""], 
  "questions": [""]
}

1. keywords: You can select multiple keywords such as Spring Boot, JPA, RDBMS, JavaScript, React.
2. questions: A list of specific questions you would like to ask.

###Requirements:
${params.options.join(',')}
`.trim();
  }
}
