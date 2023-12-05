'use client';
import { Button, HStack, Heading, Text, Textarea, VStack, useToast } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function Header() {
  const params = useSearchParams();
  const toast = useToast();

  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
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
        interviewId: parseInt(params.get('id') || '10000'),
        techStack: [resume],
        jobDescription: [jd],
        options: {
          resumeQuestion: 1,
          jdQuestion: 1,
          csQuestion: 1,
        },
      }),
    })
      .then((data) => data.json())
      .finally(() => setIsLoading(false));

    if (res.interviewId) {
      toast({ title: '면접 준비가 완료되었습니다.', status: 'success' });
    } else {
      toast({ title: res.message || '에러가 발생했습니다', status: 'error' });
    }
  };

  const handleOnFinishClick = async () => {};

  return (
    <VStack spacing={4} width={'50%'} mx={'auto'} align={'flex-start'}>
      <Heading size={'lg'}>이력서</Heading>
      <Textarea placeholder="이력서를 입력하세요." onChange={(e) => setResume(e.target.value)} />

      <Heading size={'lg'}>채용공고</Heading>
      <Textarea placeholder="채용공고를 입력하세요." onChange={(e) => setJd(e.target.value)} />

      <HStack spacing={4}>
        <Button
          colorScheme="teal"
          variant={'solid'}
          onClick={handleOnInitClick}
          isLoading={isLoading}
        >
          면접 시작
        </Button>

        <Button colorScheme="teal" variant={'outline'} onClick={handleOnFinishClick}>
          결과 확인
        </Button>
      </HStack>
    </VStack>
  );
}
