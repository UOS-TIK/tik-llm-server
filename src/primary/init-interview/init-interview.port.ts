import { Injectable } from '@nestjs/common';
import { LockInterview } from '@src/common';
import { LlmManager, MemoryStoreManager, VectorStoreManager } from '@src/secondary';
import {
  InitInterviewData,
  InitInterviewException,
  InitInterviewView,
} from './init-interview.data';

@Injectable()
export class InitInterviewPort {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly memoryStoreManager: MemoryStoreManager,
    private readonly vectorStoreManager: VectorStoreManager,
  ) {}

  @LockInterview(300)
  async execute(data: InitInterviewData): Promise<InitInterviewView> {
    await this.memoryStoreManager
      .get({
        type: 'interviewPaper',
        id: data.interviewId,
      })
      .then((interviewPaper) => {
        if (interviewPaper) throw new InitInterviewException(400, 'interview is already started.');
      });

    const resumeResult = await this.generateResumeQuestions({
      resume: data.techStack,
      questionCount: data.options.resumeQuestion,
    });

    const jdResult = await this.generateJdQuestions({
      resumeQuestions: resumeResult.questions,
      jobDescription: data.jobDescription,
      questionCount: data.options.jdQuestion,
    });

    const csResult = await this.generateCsQuestions({
      questions: [...resumeResult.questions, ...jdResult.questions],
      keywords: jdResult.keywords,
      questionCount: data.options.csQuestion,
    });

    await this.saveInterviewPaper({
      interviewId: data.interviewId,
      questions: [...resumeResult.questions, ...jdResult.questions, ...csResult.questions],
    });

    return {
      interviewId: data.interviewId,
    };
  }

  private async generateResumeQuestions(params: { resume: string[]; questionCount: number }) {
    const prompt = `
###Role:
You are a senior developer preparing for a technical interview.
Please create the interview questionnaire in Korean using the Applicant's Resume information given below.

###Applicant's Resume:
${JSON.stringify(params.resume)}

###Response Example:
Please follow this JSON format for your response.
{
  "questions": [""]
}

1. questions: 
- A list of specific questions you want to ask about the applicant's resume.
- Please create ${params.questionCount} questions.
`.trim();

    return this.llmManager.predict<{ questions: string[] }>(prompt);
  }

  private async generateJdQuestions(params: {
    resumeQuestions: string[];
    jobDescription: string[];
    questionCount: number;
  }) {
    const prompt = `
###Role:
You are a senior developer preparing for a technical interview.
Please create addtional interview questions which related to Your Company's Job description in Korean.
And, Select three computer science keywords which you want to ask considering overall interview context.
Please select 3 keywords in options(detail is in below), Do not select another keyword which is not on the options!

###Previous Questions:
- It is a list of questions you asked to applicant about resume.
${JSON.stringify(params.resumeQuestions)}

###Your Company's Job Description:
- It is your company's tech stack & job description.
- It is not applicant's resume or experience. 
- Application could be no experience about your company's tech stack.
${JSON.stringify(params.jobDescription)}

###Response Example:
Please follow this JSON format for your response.
{
  "questions": [""],
  "keywords": [""]
}

1. questions: 
- A list of specific questions you want to ask about your company's tech stack.
- Please create ${params.questionCount} questions

2. keywords: 
- A list of computer science fundamentals keywords that you want to ask.
- Options are [Database, DataStructure, Network, OS, Java, Javascript, Python]
- Select three keywords in option, do not select other keywords.
`.trim();

    return this.llmManager.predict<{
      keywords: string[];
      questions: string[];
    }>(prompt);
  }

  private async generateCsQuestions(params: {
    questions: string[];
    keywords: string[];
    questionCount: number;
  }) {
    const csTopic = await this.vectorStoreManager.findCsTopicByKeywords(params.keywords as any);

    const prompt = `
###Role:
You are a senior developer preparing for a technical interview.
Please create the additional interview questions in Korean using the information given below.

###Previous Question:
- It is a list of questions you asked to applicant about resume & tech stack.
${JSON.stringify(params.questions)}

###Recommended question topics:
- A list of suggested question topics for computer science fundamentals.
- Choose the most appropriate topic and create a question about it.
${JSON.stringify(csTopic)}

###Response Example:
Please follow this JSON format for your response.
{
  "questions": [""]
}

- Please create ${params.questionCount} questions.
`.trim();

    return this.llmManager.predict<{ questions: string[] }>(prompt);
  }

  private async saveInterviewPaper(params: { interviewId: number; questions: string[] }) {
    await Promise.all([
      this.memoryStoreManager.set({
        type: 'interviewPaper',
        id: params.interviewId,
        value: {
          items: params.questions.map((question) => ({
            question,
            answer: '',
            isCompleted: false,
            tailQuestions: [],
          })),
          finalOneLineReview: '',
          finalScore: 0,
        },
      }),
      this.memoryStoreManager.set({
        type: 'interviewHistory',
        id: params.interviewId,
        value: [
          '면접관: 안녕하세요. 먼저, 저희 회사에 지원해주셔서 감사드리며 오늘 면접 잘 부탁드리겠습니다.',
        ],
      }),
    ]);
  }
}
