'use client';

import { useState, useMemo } from 'react';
import { Table, Badge, Button, Select, Text, Group, Stack, Paper, ActionIcon } from '@mantine/core';
import { IconArrowsSort, IconSortAscending, IconSortDescending } from '@tabler/icons-react';

export interface Property {
    id: string;
    name: string;
    price: number;
    area: { m2: number; pyeong: number };
    link: string;
    note?: 'High' | 'Mid' | 'Low';
    dongName?: string;
}

interface ListingTableProps {
    data: Property[];
    onNoteChange: (id: string, note: string) => void;
}

type SortField = 'name' | 'price' | 'area' | 'dong' | null;
type SortDir = 'asc' | 'desc';

const getNaverLandUrl = (atclNo: string) => {
    if (typeof window === 'undefined') return `https://m.land.naver.com/article/info/${atclNo}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        window.navigator.userAgent
    );
    return isMobile
        ? `https://m.land.naver.com/article/info/${atclNo}`
        : `https://land.naver.com/article/articleDetailInfo.nhn?atclNo=${atclNo}`;
};

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
    if (sortField !== field) return <IconArrowsSort size={14} color="gray" />;
    return sortDir === 'asc'
        ? <IconSortAscending size={14} color="#228be6" />
        : <IconSortDescending size={14} color="#228be6" />;
}

export function ListingTable({ data, onNoteChange }: ListingTableProps) {
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    if (!data) return null;

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const sorted = useMemo(() => {
        if (!sortField) return data;
        return [...data].sort((a, b) => {
            let va: any, vb: any;
            if (sortField === 'price') { va = a.price; vb = b.price; }
            else if (sortField === 'area') { va = a.area?.m2 ?? 0; vb = b.area?.m2 ?? 0; }
            else if (sortField === 'dong') { va = a.dongName ?? ''; vb = b.dongName ?? ''; }
            else if (sortField === 'name') { va = a.name ?? ''; vb = b.name ?? ''; }
            if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === 'asc' ? va - vb : vb - va;
        });
    }, [data, sortField, sortDir]);

    const formatPrice = (price: number) => {
        const priceEok = Math.floor(price / 10000);
        const priceMan = price % 10000;
        return priceEok > 0
            ? `${priceEok}억 ${priceMan > 0 ? priceMan.toLocaleString() : ''}`
            : `${priceMan.toLocaleString()}만`;
    };

    const thStyle: React.CSSProperties = { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };

    const rows = sorted.filter(item => item).map((item) => {
        return (
            <Table.Tr key={item.id}>
                <Table.Td><Text fw={700}>{item.name}</Text></Table.Td>
                <Table.Td><Text c="red" fw={600}>{formatPrice(item.price)}</Text></Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        <Text>{item.area?.m2 || '-'}m²</Text>
                        <Text c="dimmed" size="sm">({item.area?.pyeong || '-'}평)</Text>
                    </Group>
                </Table.Td>
                <Table.Td><Text size="sm">{item.dongName || '-'}</Text></Table.Td>
                <Table.Td>
                    <Button component="a" href={getNaverLandUrl(item.id)} target="_blank" size="xs" variant="light">
                        보기
                    </Button>
                </Table.Td>
                <Table.Td>
                    <Select
                        size="xs"
                        w={100}
                        data={[
                            { value: 'High', label: '🔴 상' },
                            { value: 'Mid', label: '🟡 중' },
                            { value: 'Low', label: '⚪ 하' },
                        ]}
                        value={item.note || null}
                        onChange={(val: string | null) => val && onNoteChange(item.id, val)}
                        placeholder="-"
                    />
                </Table.Td>
            </Table.Tr>
        );
    });

    const ThSortable = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <Table.Th style={thStyle} onClick={() => handleSort(field)}>
            <Group gap={4} wrap="nowrap">
                {children}
                <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
            </Group>
        </Table.Th>
    );

    return (
        <>
            {/* Desktop Table View */}
            <Table.ScrollContainer minWidth={800} visibleFrom="sm">
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <ThSortable field="name">단지명</ThSortable>
                            <ThSortable field="price">매매가</ThSortable>
                            <ThSortable field="area">면적</ThSortable>
                            <ThSortable field="dong">동</ThSortable>
                            <Table.Th>링크</Table.Th>
                            <Table.Th>비고</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Table.ScrollContainer>

            {/* Mobile Card View */}
            <Stack hiddenFrom="sm" gap="xs" mb="xs">
                <Group gap="xs">
                    <Text size="xs" c="dimmed">정렬:</Text>
                    {(['price', 'area', 'dong', 'name'] as SortField[]).map(f => (
                        <Button
                            key={String(f)}
                            size="xs"
                            variant={sortField === f ? 'filled' : 'light'}
                            onClick={() => handleSort(f)}
                            rightSection={sortField === f ? (sortDir === 'asc' ? <IconSortAscending size={12} /> : <IconSortDescending size={12} />) : null}
                        >
                            {f === 'price' ? '가격' : f === 'area' ? '면적' : f === 'dong' ? '동' : '이름'}
                        </Button>
                    ))}
                </Group>
            </Stack>
            <Stack hiddenFrom="sm" gap="md">
                {sorted.map((item) => (
                    <Paper key={item.id} shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between" mb="xs">
                            <Text fw={700} size="lg">{item.name}</Text>
                            <Text c="red" fw={700} size="lg">{formatPrice(item.price)}</Text>
                        </Group>
                        <Text size="sm" c="dimmed" mb="xs">{item.dongName}</Text>
                        <Group justify="space-between" mb="sm">
                            <Group gap="xs">
                                <Text size="sm" c="dimmed">면적</Text>
                                <Text size="sm">{item.area?.m2 || '-'}m² ({item.area?.pyeong || '-'}평)</Text>
                            </Group>
                        </Group>
                        <Group grow>
                            <Button component="a" href={getNaverLandUrl(item.id)} target="_blank" variant="light" color="blue">
                                매물 보기
                            </Button>
                            <Select
                                data={[
                                    { value: 'High', label: '🔴 상' },
                                    { value: 'Mid', label: '🟡 중' },
                                    { value: 'Low', label: '⚪ 하' },
                                ]}
                                value={item.note || null}
                                onChange={(val: string | null) => val && onNoteChange(item.id, val)}
                                placeholder="비고"
                            />
                        </Group>
                    </Paper>
                ))}
            </Stack>
        </>
    );
}
