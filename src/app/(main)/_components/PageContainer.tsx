import { VStack } from '@chakra-ui/react';
import React from 'react';

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <VStack spacing={8} padding={8}>
      {children}
    </VStack>
  );
}
