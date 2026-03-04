'use client';

import {
    Paper, Grid, Select, NumberInput, Button, Group, Text, RangeSlider, Stack, TagsInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconSearch } from '@tabler/icons-react';

export interface FilterValues {
    regions: string[];
    tradeType: string;
    priceMax: number;
    areaMin: number;
    roomCount: number;
    minHouseholds: number;
}

interface FilterFormProps {
    onSearch: (values: FilterValues) => void;
    loading?: boolean;
    initialValues?: Partial<FilterValues>;
}

export function FilterForm({ onSearch, loading, initialValues }: FilterFormProps) {
    const form = useForm<FilterValues>({
        initialValues: {
            regions: ['songpa', 'seocho'],
            tradeType: 'A1',   // Sale
            priceMax: 20,  // 20 Eok
            areaMin: 120,   // 120m2
            roomCount: 4,  // 4 rooms
            minHouseholds: 500,
            ...initialValues
        },
    });

    const pyeongValue = form.values.areaMin ? Math.round(form.values.areaMin / 3.3058) : 0;

    return (
        <Paper withBorder p="md" radius="md" shadow="sm">
            <form onSubmit={form.onSubmit((values: FilterValues) => onSearch(values))}>
                <Grid align="flex-end" gutter="md">
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <TagsInput
                            label="지역 검색"
                            placeholder="구/동 입력 후 엔터 (예: 송파구, 풍납동)"
                            {...form.getInputProps('regions')}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                        <Select
                            label="거래 유형"
                            data={[
                                { value: 'A1', label: '매매' },
                                { value: 'B1', label: '전세' },
                            ]}
                            {...form.getInputProps('tradeType')}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <NumberInput
                            label="가격 상한 (억원)"
                            description="예: 30 (30억)"
                            step={1}
                            thousandSeparator
                            {...form.getInputProps('priceMax')}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                        <NumberInput
                            label="최소 면적 (m²)"
                            description={pyeongValue > 0 ? `약 ${pyeongValue}평` : '평수 자동 계산'}
                            placeholder="84"
                            {...form.getInputProps('areaMin')}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                        <NumberInput
                            label="최소 방 개수"
                            placeholder="예: 3"
                            min={0}
                            {...form.getInputProps('roomCount')}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 2 }}>
                        <Button
                            type="submit"
                            fullWidth
                            loading={loading}
                            leftSection={<IconSearch size="1rem" />}
                            color="blue"
                        >
                            지금 탐색
                        </Button>
                    </Grid.Col>
                </Grid>
            </form>
        </Paper>
    );
}
