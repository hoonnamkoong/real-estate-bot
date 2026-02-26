'use client';

import { useEffect } from 'react';
import { Container, Title, Text, Button, Stack } from '@mantine/core';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Client-side Exception:', error);
    }, [error]);

    return (
        <Container size="sm" py="xl">
            <Stack align="center" gap="md">
                <Title order={2}>문제가 발생했습니다</Title>
                <Text c="red" fw={500}>{error.message || '알 수 없는 클라이언트 에러'}</Text>
                {error.digest && <Text size="xs" c="dimmed">Error ID: {error.digest}</Text>}
                <Button
                    onClick={() => reset()}
                    variant="light"
                >
                    다시 시도
                </Button>
            </Stack>
        </Container>
    );
}
