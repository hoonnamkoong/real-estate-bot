'use client';

import { useState, useTransition, useEffect } from 'react';
import { Container, Title, Text, Stack, Box, LoadingOverlay, Group } from '@mantine/core';
import { FilterForm, FilterValues } from '@/components/Search/FilterForm';
import { ListingTable, Property } from '@/components/Property/ListingTable';
import { searchProperties, updatePropertyNote, searchPropertiesChunk, getRegionPointCount } from '@/app/actions'; // Actions are fine here
import dayjs from 'dayjs';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// Extract SearchContent props
interface SearchContentProps {
    initialData: { settings: FilterValues, results: Property[] } | null;
}

export function SearchContent({ initialData }: SearchContentProps) {
    // Debug initialData
    useEffect(() => {
        console.log('[SearchContent] Initial Data Received:', JSON.stringify(initialData, null, 2));
    }, [initialData]);
    // Initialize with snapshot results if available
    const [properties, setProperties] = useState<Property[]>(initialData?.results || []);
    const [isPending, startTransition] = useTransition();
    // If we have results, consider it 'searched'
    const [searched, setSearched] = useState(!!initialData?.results && initialData.results.length > 0);
    const [searchTime, setSearchTime] = useState<string | null>(initialData?.results?.length ? 'Last Snapshot' : null);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

    // Helper for UI Sync
    const updateProgress = async (msg: string) => {
        console.log(`[Progress Update] ${msg}`);
        setLoadingMessage(msg);
        // Small delay to allow UI to render the message before next blocking action
        await new Promise(res => setTimeout(res, 100));
    };

    const handleSearch = async (values: FilterValues) => {
        console.log('[handleSearch] Starting search with:', values);

        // 1. URL Update
        const params = new URLSearchParams();
        if (values.regions && values.regions.length) params.set('regions', values.regions.join(','));
        if (values.tradeType) params.set('tradeType', values.tradeType);
        if (values.priceMax) params.set('priceMax', String(values.priceMax));
        if (values.areaMin) params.set('areaMin', String(values.areaMin));
        if (values.roomCount) params.set('roomCount', String(values.roomCount));
        router.replace(`${pathname}?${params.toString()}`);

        // 2. Initial UI State (Immediate)
        setProperties([]);
        setSearched(true);
        setLoadingMessage('검색 준비 중...');

        // 3. Sequential Search using startTransition for the heavy work
        startTransition(async () => {
            try {
                // Debug: Fallback results if search fails or is empty to verify table rendering
                let results = await searchProperties(values);
                if (results.length === 0) {
                    console.log('Search returned 0, adding mock to verify UI Table Rendering');
                    results = [{
                        id: 'MOCK_VERIFY_1',
                        name: 'UI 검증용 가상 매물 (잠실)',
                        price: 250000,
                        area: { m2: 132, pyeong: 40 },
                        link: 'https://m.land.naver.com/',
                        dongName: '잠실동',
                        note: 'Mid'
                    }];
                }
                setProperties(results);

                setSearchTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
                setLoadingMessage(null);
            } catch (error: any) {
                console.error('[handleSearch] Search failed:', error);
                // Fallback to mock on error to verify table UI
                setProperties([{
                    id: 'ERROR_VERIFY_1',
                    name: `에러 시 UI 검증용 (${error.message || 'Timeout'})`,
                    price: 200000,
                    area: { m2: 84, pyeong: 25 },
                    link: 'https://m.land.naver.com/',
                    dongName: '에러 복구 모드',
                    note: 'Low'
                }]);
                setLoadingMessage(`에러 발생: ${error.message || 'Unknown'}`);
                setTimeout(() => setLoadingMessage(null), 5000);
            }
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

        // Default Fallback
        const defaults: FilterValues = {
            regions: ['songpa', 'seocho'],
            tradeType: 'A1',
            priceMax: 20,
            areaMin: 120,
            roomCount: 4,
            minHouseholds: 500
        };

        const lastSettings = initialData?.settings;
        const hasUrlParams = Object.keys(fromUrl).length > 0;

        // Merge: Defaults -> LastSettings (if no URL) -> URL
        const merged: FilterValues = {
            ...defaults,
            ...((!hasUrlParams && lastSettings) ? lastSettings : {}),
            ...fromUrl
        };

        if (merged.regions.length === 0) merged.regions = ['songpa', 'seocho'];
        return merged;
    };

    const initialValues = getInitialValues();

    // Auto-Search Removed as per user request to prevent instant blocking/rate-limiting.
    // User must click 'Search' button manually.
    /* 
    useEffect(() => {
        if (searched) return; 

        const hasUrlKeyParams = searchParams.has('regions') || searchParams.has('tradeType');

        if (hasUrlKeyParams) {
            handleSearch(initialValues);
        } else if (!searched && initialData?.settings) {
            handleSearch(initialValues);
        }
    }, []);
    */

    const handleNoteChange = async (id: string, note: string) => {
        setProperties(prev => prev.map(p => p && p.id === id ? { ...p, note: note as any } : p));
        await updatePropertyNote(id, note);
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Box pos="relative">
                    <LoadingOverlay
                        visible={isPending}
                        overlayProps={{ radius: "sm", blur: 2 }}
                        loaderProps={{
                            children: (
                                <Stack align="center" gap="xs">
                                    <Text fw={700} size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                                        {loadingMessage || '탐색 중...'}
                                    </Text>
                                    <Text size="sm" c="dimmed">인프라 부하를 방지하기 위해 단계별로 데이터를 수집하고 있습니다.</Text>
                                </Stack>
                            )
                        }}
                    />
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

                    {properties && properties.length > 0 ? (
                        <ListingTable data={properties} onNoteChange={handleNoteChange} />
                    ) : (
                        searched && !isPending && <Text c="dimmed" ta="center" py="xl">조건에 맞는 매물이 없습니다.</Text>
                    )}
                    {!searched && !isPending && <Text c="dimmed" ta="center" py="xl">검색 조건을 입력하고 검색 버튼을 눌러주세요.</Text>}

                    <Text c="dimmed" size="xs" ta="center" mt="xl">
                        Real Estate Bot v1.5 (Telegram Enabled)
                    </Text>
                </Box>
            </Stack>
        </Container>
    );
}
