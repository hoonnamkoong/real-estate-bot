'use client';

import { Container, Stack, Title, Text, LoadingOverlay, Box, Group } from '@mantine/core';
import { useState, useTransition, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import dayjs from 'dayjs';
import { Header } from '@/components/Layout/Header';
import { FilterForm, FilterValues } from '@/components/Search/FilterForm';
import { ListingTable, Property } from '@/components/Property/ListingTable';
import { searchProperties, updatePropertyNote } from './actions';

export default function Home() {
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
    if (searchParams.toString() && !searched) {
      // Reconstruct full values with defaults if needed, or rely on form
      // Actually we need to call handleSearch with *Values*.
      // Since the form has the merged values, we can't easily retrieve them here unless we duplicate default logic.
      // Better approach: Let the form initialize, but here we just construct the object.
      const values: FilterValues = {
        regions: initialFilterValues.regions || ['songpa', 'seocho'],
        tradeType: initialFilterValues.tradeType || 'A1',
        priceMax: initialFilterValues.priceMax || 20,
        areaMin: initialFilterValues.areaMin || 120,
        roomCount: initialFilterValues.roomCount || 4,
        minHouseholds: 500
      };
      handleSearch(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

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
    </main>
  );
}
