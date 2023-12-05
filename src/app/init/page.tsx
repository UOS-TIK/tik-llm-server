'use client';
import {
  useToast,
  VStack,
  Heading,
  Textarea,
  Button,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function InitPage() {
  const router = useRouter();
  const toast = useToast();

  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [questionCount, setQuestionCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const handleOnInitClick = async () => {
    setIsLoading(true);

    const res = await fetch('http://localhost:4000/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.NEXT_PUBLIC_LLM_API_KEY || '',
      },
      body: JSON.stringify({
        interviewId: Math.floor(Math.random() * (1000000 - 100000 + 1)) + 100000,
        techStack: [resume],
        jobDescription: [jd],
        options: {
          resumeQuestion: Math.round(questionCount / 3),
          jdQuestion: Math.floor(questionCount / 3),
          csQuestion: Math.ceil(questionCount / 3),
        },
      }),
    })
      .then((data) => data.json())
      .finally(() => setIsLoading(false));

    if (res.interviewId) {
      toast({ title: '면접 준비가 완료되었습니다.', status: 'success' });
      setTimeout(() => router.push(`/speak/${res.interviewId}`), 1000);
    } else {
      toast({ title: res.message || '에러가 발생했습니다', status: 'error' });
    }
  };

  return (
    <VStack align={'flex-start'} width={'50%'} mx={'auto'} my={16} spacing={8}>
      <Heading size={'lg'}>이력서</Heading>
      <Textarea placeholder="이력서를 입력하세요." onChange={(e) => setResume(e.target.value)} />

      <Heading size={'lg'}>채용공고</Heading>
      <Textarea placeholder="채용공고를 입력하세요." onChange={(e) => setJd(e.target.value)} />

      <Heading size={'lg'}>질문 갯수</Heading>
      <NumberInput value={questionCount} onChange={(e) => setQuestionCount(parseInt(e) || 0)}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      <Button
        colorScheme="facebook"
        variant={'solid'}
        onClick={handleOnInitClick}
        isLoading={isLoading}
      >
        면접 시작하기
      </Button>
    </VStack>
  );
}
