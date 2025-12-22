'use client';

import { Container, Stack, Title, Text, LoadingOverlay, Box, Group, LoadingOverlayProps } from '@mantine/core';
import { useState, useTransition, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import dayjs from 'dayjs';
import { Header } from '@/components/Layout/Header';
import { FilterForm, FilterValues } from '@/components/Search/FilterForm';
import { ListingTable, Property } from '@/components/Property/ListingTable';
import { searchProperties, updatePropertyNote } from './actions';

function SearchContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);
  const [searchTime, setSearchTime] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse Initial Values from URL
  const initialFilterValues: Partial<FilterValues> = {};
  if (searchParams.get('regions')) initialFilterValues.regions = searchParams.get('regions')?.split(',') || [];
  if (searchParams.get('tradeType')) initialFilterValues.tradeType = searchParams.get('tradeType')!;
  if (searchParams.get('priceMax')) initialFilterValues.priceMax = Number(searchParams.get('priceMax'));
  if (searchParams.get('areaMin')) initialFilterValues.areaMin = Number(searchParams.get('areaMin'));
  if (searchParams.get('roomCount')) initialFilterValues.roomCount = Number(searchParams.get('roomCount'));

  const handleSearch = (values: FilterValues) => {
    // Update URL
    const params = new URLSearchParams();
    if (values.regions.length) params.set('regions', values.regions.join(','));
    if (values.tradeType) params.set('tradeType', values.tradeType);
    if (values.priceMax) params.set('priceMax', String(values.priceMax));
    if (values.areaMin) params.set('areaMin', String(values.areaMin));
    if (values.roomCount) params.set('roomCount', String(values.roomCount));
    router.replace(`${pathname}?${params.toString()}`);

    startTransition(async () => {
      const result = await searchProperties(values);
      setProperties(result);
      setSearched(true);
      setSearchTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    });
  };

  // Auto-Search on Mount if Params exist
  useEffect(() => {
    // Only trigger if we haven't searched yet and there are params in the URL.
    // We check if any relevant param keys exist.
    const hasParams = searchParams.has('regions') || searchParams.has('tradeType') || searchParams.has('priceMax');

    if (hasParams && !searched) {
      const values: FilterValues = {
        regions: initialFilterValues.regions?.length ? initialFilterValues.regions : ['songpa', 'seocho'],
        tradeType: initialFilterValues.tradeType || 'A1',
        priceMax: initialFilterValues.priceMax || 20,
        areaMin: initialFilterValues.areaMin || 120,
        roomCount: initialFilterValues.roomCount || 4,
        minHouseholds: 500
      };
      // Use setTimeout to allow initial render to settle if needed, though usually not required.
      // We pass the constructed values directly to the search function logic (bypassing the form state which might be lagging)
      handleSearch(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Depend on searchParams so it fires when they are ready. Added debouncing or check to prevent loops.


  const handleNoteChange = async (id: string, note: string) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, note: note as any } : p));
    await updatePropertyNote(id, note);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Box pos="relative">
          <LoadingOverlay visible={isPending} overlayProps={{ radius: "sm", blur: 2 }} />
          <FilterForm onSearch={handleSearch} loading={isPending} initialValues={initialFilterValues} />
        </Box>

        <Box>
          <Group justify="space-between" mb="md" align="center">
            <Title order={4}>
              검색 결과 {searched && `(${properties.length}건)`}
            </Title>
            {searchTime && (
              <Text size="sm" c="dimmed">
                탐색 시간: {searchTime}
              </Text>
            )}
          </Group>

          {properties.length > 0 ? (
            <ListingTable data={properties} onNoteChange={handleNoteChange} />
          ) : (
            searched && <Text c="dimmed" ta="center" py="xl">조건에 맞는 매물이 없습니다.</Text>
          )}
          {!searched && <Text c="dimmed" ta="center" py="xl">검색 조건을 입력하고 검색 버튼을 눌러주세요.</Text>}

          <Text c="dimmed" size="xs" ta="center" mt="xl">
            Real Estate Bot v1.5 (Telegram Enabled)
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}

export default function Home() {
  return (
    <main>
      <Header />
      <Suspense fallback={<Box p="xl"><Text ta="center">Loading Search...</Text></Box>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}
