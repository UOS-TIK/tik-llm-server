export interface FinishInterviewData {
  interviewId: number;
}

export interface FinishInterviewView {
  interviewHistory: string[];

  interviewPaper: {
    items: {
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
    finalOneLineReview: string;
    finalScore: number;
  };
}
