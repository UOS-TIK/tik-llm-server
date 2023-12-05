'use client';
import { Button, Heading, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function MainPage() {
  return (
    <VStack my={8} spacing={8}>
      <Heading>TTS & STT 데모</Heading>
      <Link href={'/init'}>
        <Button colorScheme="facebook" size={'lg'}>
          시작하기
        </Button>
      </Link>
    </VStack>
  );
}

/*
[이력서]
백엔드 개발자
- Typescript + Nestjs 
- Rust + Tonic
- Kotlin + Domain Graph Service
- RDBMS, ElasticSearch, AWS

[공고]
자격요건
- 해당 경력 3년 이상 혹은 그에 준하는 실력을 보유하신 분
- 백엔드 개발에 대한 이해가 있으신 분
- 클라우드 서비스(AWS) 사용 경험이 있으신 분
- RDBMS(MySQL) 및 NoSQL 개발 경험이 있으신 분
- HTTP RESTful API 설계 및 서비스 개발 경험이 있으신 분
- 주도적으로 프로젝트를 진행할 수 있는 분
- 자신의 성장과 서비스 개선을 위해 꾸준히 노력하는 분
- 팀 단위의 협업을 중시하시는 분
- 학력 및 전공 무관


사용 기술
- Node.js(Typescript)
- Mysql/MongoDB/Redis/DynamoDB
- Elastic Search

우대사항
- O2O(Online To Offline) 서비스 개발 경험
- NodeJS 실무 경험(TypeScript)
- 마이크로 서비스 기반의 개발 경험
- 대용량 트래픽 및 데이터를 다뤄 본 경험
- Mysql, MongoDB, Redis, DynamoDB, MessageQueue등 RDBMS 및 NoSql 사용 경험
*/
