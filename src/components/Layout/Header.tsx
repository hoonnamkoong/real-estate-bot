'use client';

import { Group, Title, Button, Container, ThemeIcon } from '@mantine/core';
import { IconBuildingSkyscraper, IconSettings } from '@tabler/icons-react';

export function Header() {
    return (
        <header style={{ borderBottom: '1px solid #eee', backgroundColor: '#fff' }}>
            <Container size="xl" py="md">
                <Group justify="space-between">
                    <Group>
                        <ThemeIcon size="lg" radius="md" variant="filled" color="blue">
                            <IconBuildingSkyscraper size="1.2rem" />
                        </ThemeIcon>
                        <Title order={3}>부동산 봇 (v1.2)</Title>
                    </Group>

                    <Group>
                        {/* Future: Settings or Auth */}
                        <Button variant="subtle" leftSection={<IconSettings size="1rem" />} color="gray">
                            설정
                        </Button>
                    </Group>
                </Group>
            </Container>
        </header>
    );
}
