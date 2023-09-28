export interface FinishInterviewData {
  interviewId: number;
}

export interface FinishInterviewView {
  interviewHistory: string[];

  interviewPaper: {
    question: string;
    answer: string;
    evaluation: {
      comment: string;
      score: number;
    };
    tailQuestions: {
      question: string;
      answer: string;
      evaluation: {
        comment: string;
        score: number;
      };
    }[];
  }[];
}
