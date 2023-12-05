'use client';
import { Heading, Textarea, VStack, useToast } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function FinishPage() {
  const params = useSearchParams();
  const toast = useToast();

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
    const interval = setInterval(() => {
      fetch('http://localhost:4000/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: process.env.NEXT_PUBLIC_LLM_API_KEY || '',
        },
        body: JSON.stringify({
          interviewId: parseInt(params.get('id') || '1'),
        }),
      })
        .then((data) => data.json())
        .then((json) => setInterviewPaper(json.interviewPaper))
        .catch((err) => toast({ title: err.message, status: 'error' }));
    }, 5000);

    return () => clearInterval(interval);
  }, [params, toast]);

  return (
    <VStack my={8} spacing={8}>
      <Heading>결과 확인</Heading>
      <Textarea disabled={true} width={'80%'} height={'80lvh'}>
        {interviewPaper ? JSON.stringify(interviewPaper, null, 2) : '평가중 입니다.'}
      </Textarea>
    </VStack>
  );
}
