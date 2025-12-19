'use client';

import { Table, Badge, Button, Select, Anchor, Text, Group, Stack, Paper } from '@mantine/core';

export interface Property {
    id: string; // Complex ID or Article No
    name: string; // Complex Name
    price: number; // Price in Man-won
    households: number;
    area: { m2: number; pyeong: number };
    link: string; // Naver Real Estate Link
    note?: 'High' | 'Mid' | 'Low';
}

interface ListingTableProps {
    data: Property[];
    onNoteChange: (id: string, note: string) => void;
}

export function ListingTable({ data, onNoteChange }: ListingTableProps) {
    const rows = data.map((item) => {
        // Format Price: 15억 5,000 or similar
        // Input is in Man-won (e.g. 155000 -> 15억 5000)
        const priceEok = Math.floor(item.price / 10000);
        const priceMan = item.price % 10000;
        const priceStr = priceEok > 0
            ? `${priceEok}억 ${priceMan > 0 ? priceMan.toLocaleString() : ''}`
            : `${priceMan.toLocaleString()}만`;

        return (
            <Table.Tr key={item.id}>
                <Table.Td>
                    <Text fw={700}>{item.name}</Text>
                </Table.Td>
                <Table.Td>
                    <Text c="red" fw={600}>{priceStr}</Text>
                </Table.Td>
                <Table.Td>{item.households}세대</Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        <Text>{item.area.m2}m²</Text>
                        <Text c="dimmed" size="sm">({item.area.pyeong}평)</Text>
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Button component="a" href={item.link} target="_blank" size="xs" variant="light">
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

    return (
        <>
            {/* Desktop Table View */}
            <Table.ScrollContainer minWidth={800} visibleFrom="sm">
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>단지명</Table.Th>
                            <Table.Th>매매가</Table.Th>
                            <Table.Th>세대수</Table.Th>
                            <Table.Th>면적</Table.Th>
                            <Table.Th>링크</Table.Th>
                            <Table.Th>비고</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Table.ScrollContainer>

            {/* Mobile Card View */}
            <Stack hiddenFrom="sm" gap="md">
                {data.map((item) => {
                    const priceEok = Math.floor(item.price / 10000);
                    const priceMan = item.price % 10000;
                    const priceStr = priceEok > 0
                        ? `${priceEok}억 ${priceMan > 0 ? priceMan.toLocaleString() : ''}`
                        : `${priceMan.toLocaleString()}만`;

                    return (
                        <Paper key={item.id} shadow="sm" radius="md" p="md" withBorder>
                            <Group justify="space-between" mb="xs">
                                <Text fw={700} size="lg">{item.name}</Text>
                                <Text c="red" fw={700} size="lg">{priceStr}</Text>
                            </Group>

                            <Group gap="apart" mb="sm">
                                <Group gap="xs">
                                    <Text size="sm" c="dimmed">면적</Text>
                                    <Text size="sm">{item.area.m2}m² ({item.area.pyeong}평)</Text>
                                </Group>
                                <Group gap="xs">
                                    <Text size="sm" c="dimmed">세대수</Text>
                                    <Text size="sm">{item.households}세대</Text>
                                </Group>
                            </Group>

                            <Group grow>
                                <Button component="a" href={item.link} target="_blank" variant="light" color="blue">
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
                    );
                })}
            </Stack>
        </>
    );
}
