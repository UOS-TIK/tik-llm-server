'use client';
import { VStack } from '@chakra-ui/react';
import { Header } from './_components/Header';
import { Section } from './_components/Section';

export default function Home() {
  return (
    <VStack spacing={8} padding={8}>
      <Header />
      <Section />
    </VStack>
  );
}
