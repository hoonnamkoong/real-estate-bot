'use client';

import { Container, Stack, Title, Text, LoadingOverlay, Box } from '@mantine/core';
import { useState, useTransition } from 'react';
import { Header } from '@/components/Layout/Header';
import { FilterForm, FilterValues } from '@/components/Search/FilterForm';
import { ListingTable, Property } from '@/components/Property/ListingTable';
import { searchProperties, updatePropertyNote } from './actions';

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);

  const handleSearch = (values: FilterValues) => {
    startTransition(async () => {
      const result = await searchProperties(values);
      setProperties(result);
      setSearched(true);
    });
  };

  const handleNoteChange = async (id: string, note: string) => {
    // Optimistic Update
    setProperties(prev => prev.map(p => p.id === id ? { ...p, note: note as any } : p));
    await updatePropertyNote(id, note);
  };

  return (
    <main>
      <Header />
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Box pos="relative">
            <LoadingOverlay visible={isPending} overlayProps={{ radius: "sm", blur: 2 }} />
            <FilterForm onSearch={handleSearch} loading={isPending} />
          </Box>

          <Box>
            <Title order={4} mb="md">검색 결과 {searched && `(${properties.length}건)`}</Title>
            {properties.length > 0 ? (
              <ListingTable data={properties} onNoteChange={handleNoteChange} />
            ) : (
              searched && <Text c="dimmed" ta="center" py="xl">조건에 맞는 매물이 없습니다.</Text>
            )}
            {!searched && <Text c="dimmed" ta="center" py="xl">검색 조건을 입력하고 검색 버튼을 눌러주세요.</Text>}
          </Box>
        </Stack>
      </Container>
    </main>
  );
}
