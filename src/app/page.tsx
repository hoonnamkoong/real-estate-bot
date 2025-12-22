import { Suspense } from 'react';
import { Box, Text } from '@mantine/core';
import { Header } from '@/components/Layout/Header';
import { SearchContent } from '@/components/Search/SearchContent';
import { getLastSearchSetting } from '@/app/queries'; // Use absolute import properly

export const dynamic = 'force-dynamic';

export default async function Home() {
  const initialData = await getLastSearchSetting();

  return (
    <main>
      <Header />
      <Suspense fallback={<Box p="xl"><Text ta="center">Loading Search...</Text></Box>}>
        <SearchContent initialData={initialData} />
      </Suspense>
    </main>
  );
}
