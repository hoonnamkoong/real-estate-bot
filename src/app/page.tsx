'use client';

import { Suspense, useState, useTransition, useEffect } from 'react';
import { Container, Title, Text, Stack, Box, LoadingOverlay, Group } from '@mantine/core';
import { FilterForm, FilterValues } from '@/components/Search/FilterForm';
import { ListingTable, Property } from '@/components/Property/ListingTable';
import { searchProperties, updatePropertyNote, getLastSearchSetting } from './actions';
import { Header } from '@/components/Layout/Header';
import dayjs from 'dayjs';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// Extract SearchContent props
interface SearchContentProps {
  lastSettings: FilterValues | null;
}

function SearchContent({ lastSettings }: SearchContentProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);
  const [searchTime, setSearchTime] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (values: FilterValues) => {
    // Update URL
    const params = new URLSearchParams();
    if (values.regions && values.regions.length) params.set('regions', values.regions.join(','));
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

  // Derive initial values
  const getInitialValues = (): FilterValues => {
    const fromUrl: Partial<FilterValues> = {};
    if (searchParams.get('regions')) fromUrl.regions = searchParams.get('regions')?.split(',') || [];
    if (searchParams.get('tradeType')) fromUrl.tradeType = searchParams.get('tradeType') as any;
    if (searchParams.get('priceMax')) fromUrl.priceMax = Number(searchParams.get('priceMax'));
    if (searchParams.get('areaMin')) fromUrl.areaMin = Number(searchParams.get('areaMin'));
    if (searchParams.get('roomCount')) fromUrl.roomCount = Number(searchParams.get('roomCount'));

    const hasUrlParams = Object.keys(fromUrl).length > 0;

    // Default Fallback
    const defaults: FilterValues = {
      regions: ['songpa', 'seocho'],
      tradeType: 'A1',
      priceMax: 20,
      areaMin: 120,
      roomCount: 4,
      minHouseholds: 500
    };

    // Merge: Defaults -> LastSettings (if no URL) -> URL
    const merged: FilterValues = {
      ...defaults,
      ...((!hasUrlParams && lastSettings) ? lastSettings : {}),
      ...fromUrl
    };

    // Ensure regions array is not empty
    if (merged.regions.length === 0) merged.regions = ['songpa', 'seocho'];

    return merged;
  };

  // Using a ref or just calculating once? 
  // Calculating on every render is fine, it's cheap. 
  // But for the useEffect trigger, we should be careful.
  const initialValues = getInitialValues();

  // Auto-Search on Mount
  useEffect(() => {
    if (searched) return;

    // Check if we should auto-search
    // 1. URL params exist (Deep Linking)
    // 2. OR No URL params but we have Last Settings (Global State)
    const hasUrlKeyParams = searchParams.has('regions') || searchParams.has('tradeType');
    const shouldUseLast = !hasUrlKeyParams && !!lastSettings;

    if (hasUrlKeyParams || shouldUseLast) {
      // We use the derived initialValues which already prioritized URL > Last
      handleSearch(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNoteChange = async (id: string, note: string) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, note: note as any } : p));
    await updatePropertyNote(id, note);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Box pos="relative">
          <LoadingOverlay visible={isPending} overlayProps={{ radius: "sm", blur: 2 }} />
          <FilterForm onSearch={handleSearch} loading={isPending} initialValues={initialValues} />
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

export default async function Home() {
  const lastSettings = await getLastSearchSetting();

  return (
    <main>
      <Header />
      <Suspense fallback={<Box p="xl"><Text ta="center">Loading Search...</Text></Box>}>
        <SearchContent lastSettings={lastSettings} />
      </Suspense>
    </main>
  );
}
