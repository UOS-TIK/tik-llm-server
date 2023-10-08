export interface InitInterviewData {
  interviewId: number;
  techStack: string[];
  jobDescription: string[];
  options: {
    questionCount: number;
  };
}

export interface InitInterviewView {
  interviewId: number;
}
