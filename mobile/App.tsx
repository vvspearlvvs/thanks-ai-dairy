import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiaryApp } from './src/components/DiaryApp';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DiaryApp />
    </QueryClientProvider>
  );
}
