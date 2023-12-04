import { tags } from 'typia';

export interface NonCotData {
  interviewId: number & tags.Type<'uint32'>;
  techStack: string[];
  jobDescription: string[];
  options: {
    resumeQuestion: number;
    jdQuestion: number;
    csQuestion: number;
  };
}

export interface NonCotView {
  id: number;
}
