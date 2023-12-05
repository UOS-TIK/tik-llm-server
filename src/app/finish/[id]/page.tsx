'use client';
import { fetchLlm } from '@/client/fetch-llm';
import { Heading, Textarea, VStack } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function FinishPage() {
  const params = useParams();

  const [interviewPaper, setInterviewPaper] = useState<{
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
  }>();

  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await fetchLlm('/finish', {
        interviewId: parseInt(params.id as string),
      });

      if (data.interviewPaper) {
        setInterviewPaper(data.interviewPaper);
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [params.id]);

  return (
    <VStack my={8} spacing={8}>
      <Heading>결과 확인</Heading>
      <Textarea
        disabled={true}
        width={'80%'}
        height={'80lvh'}
        value={interviewPaper ? JSON.stringify(interviewPaper, null, 2) : '평가중 입니다.'}
      />
    </VStack>
  );
}
