import { BadRequestException, Injectable } from '@nestjs/common';
import { InterviewLock } from '@src/common';
import { LlmManager, MemoryStoreManager } from '@src/secondary';
import { InitInterviewData, InitInterviewView } from './init-interview.data';

@Injectable()
export class InitInterviewPort {
  constructor(
    private readonly llmManager: LlmManager,
    private readonly memoryStoreManager: MemoryStoreManager,
  ) {}

  @InterviewLock(300)
  async execute(data: InitInterviewData): Promise<InitInterviewView> {
    await this.memoryStoreManager
      .get({
        type: 'interviewPaper',
        id: data.interviewId,
      })
      .catch(() => null)
      .then((interviewPaper) => {
        if (interviewPaper) throw new BadRequestException('interview is already started.');
      });

    const result = await this.llmManager.predict<{
      keywords: string[];
      questions: string[];
    }>(
      this.buildPrompt({
        techStack: data.techStack,
        jobDescription: data.jobDescription,
        questionCount: Math.ceil(data.options.questionCount / 2),
      }),
    );

    const csResult = await this.llmManager.predict<{
      csQuestions: string[];
    }>(
      this.buildCsPrompt({
        questions: result.questions,
        keywords: result.keywords,
        csQuestionCount: Math.floor(data.options.questionCount / 2),
      }),
    );

    await this.memoryStoreManager.set({
      type: 'interviewPaper',
      id: data.interviewId,
      value: {
        items: [...result.questions, ...csResult.csQuestions].map((question) => ({
          question,
          answer: '',
          isCompleted: false,
          tailQuestions: [],
        })),
        finalOneLineReview: '',
        finalScore: 0,
      },
    });

    await this.memoryStoreManager.set({
      type: 'interviewHistory',
      id: data.interviewId,
      value: [
        '면접관: 안녕하세요. 먼저, 저희 회사에 지원해주셔서 감사드리며 오늘 면접 잘 부탁드리겠습니다.',
      ],
    });

    return {
      interviewId: data.interviewId,
    };
  }

  private buildPrompt(params: {
    techStack: string[];
    jobDescription: string[];
    questionCount: number;
  }) {
    return `
###Role:
You are a senior developer preparing for a technical interview.
Please create the interview questionnaire in Korean using the information given below.

###Applicant's Tech Stack:
${JSON.stringify(params.techStack)}

###Job Description:
${JSON.stringify(params.jobDescription)}

###Response Example:
Please follow this JSON format for your response.
{
  "questions": [""],
  "keywords": [""]
}

1. questions: 
- A list of specific questions you want to ask about the applicant's tech stack.
- Please create ${params.questionCount} questions

2. keywords: 
- A list of computer science fundamentals keywords that you want to ask.
- Your options are Algorithm, Database, DataStructure, Network, OS, Java, Javascript, Python.
- Please select 3 keywords.
`.trim();
  }

  private buildCsPrompt(params: {
    questions: string[];
    keywords: string[];
    csQuestionCount: number;
  }) {
    // TODO: change keyword to topic
    const topics = params.keywords;

    return `
###Role:
You are a senior developer preparing for a technical interview.
Please create the additional interview questions in Korean using the information given below.

###Applicant specific questions
- A list of questions you've prepared considering the applicant's tech stack and yours.
${JSON.stringify(params.questions)}

###Recommended question topics
- A list of suggested question topics for computer science fundamentals.
- Choose the most appropriate topic and create a question about it.
${JSON.stringify(topics)}

###Response Example:
Please follow this JSON format for your response.
{
  "csQuestions": [""]
}

- Please create ${params.csQuestionCount} csQuestions.
`.trim();
  }
}
