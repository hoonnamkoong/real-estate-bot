import 'react-native-url-polyfill/auto';
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';

// Use production Vercel URL
const VERCEL_URL = 'https://real-estate-bot-eta.vercel.app';

export default function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [successCount, setSuccessCount] = useState(0);
  const isProcessing = useRef(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('ko-KR');
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  const fetchJob = async () => {
    if (isProcessing.current || !isActive) return;
    try {
      isProcessing.current = true;
      const res = await fetch(`${VERCEL_URL}/api/proxy/pending`, { cache: 'no-store' });
      const data = await res.json();

      if (data?.job) {
        addLog(`📦 검색 지령 수신 (Job ID: ${data.job.id.substring(0, 6)}...)`);
        await processJob(data.job);
      }
    } catch (e: any) {
      // addLog(`❌ 폴링 에러: ${e.message}`); // Too noisy for timeout/offline
    } finally {
      isProcessing.current = false;
    }
  };

  const processJob = async (job: any) => {
    const urls: string[] = job.params?.urls || [];
    if (urls.length === 0) {
      addLog(`⚠️ 빈 URL 리스트`);
      await completeJob(job.id, [], 'ERROR');
      return;
    }

    addLog(`🔍 무차단망 이용 접속: ${urls.length} 포인트 스캔 중...`);
    const allItems: any[] = [];

    // Fetch in chunks of 4 to save Android memory/network
    for (let i = 0; i < urls.length; i += 4) {
      const batch = urls.slice(i, i + 4);
      const batchResults = await Promise.all(
        batch.map(async (url) => {
          try {
            const res = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://m.land.naver.com/'
              }
            });
            if (!res.ok) return [];
            const json = await res.json();
            return Array.isArray(json.body) ? json.body : [];
          } catch (e) {
            return [];
          }
        })
      );
      allItems.push(...batchResults.flat());
    }

    addLog(`✅ 스캔 완료: 원천 데이터 ${allItems.length}건 수집`);
    await completeJob(job.id, allItems, 'COMPLETED');
  };

  const completeJob = async (jobId: string, result: any[], status: string) => {
    try {
      addLog(`📤 Vercel 로 데이터 전송 중...`);
      const res = await fetch(`${VERCEL_URL}/api/proxy/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, result, status })
      });
      if (res.ok) {
        addLog(`🎉 Vercel 전송 성공! 백엔드 승계 완료`);
        if (status === 'COMPLETED') {
          setSuccessCount(prev => prev + 1);
        }
      } else {
        addLog(`❌ 서버 전송 실패: HTTP ${res.status}`);
      }
    } catch (e: any) {
      addLog(`❌ 전송 에러: ${e.message}`);
    }
  };

  useEffect(() => {
    addLog(`🚀 부동산 봇 프록시 에이전트 가동 시작`);
    const interval = setInterval(() => {
      fetchJob();
    }, 1500); // 1.5초 주기 폴링

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>부동산 봇 우회 서버</Text>
        <Text style={styles.status}>상태: {isActive ? '🟢 Vercel 지령 대기 중' : '🔴 정지'}</Text>
        <Text style={styles.stats}>누적 전송 횟수: {successCount}회</Text>
      </View>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    padding: 20,
    backgroundColor: '#2D2D2D',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
    color: '#FFF',
  },
  stats: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 5,
  },
  logContainer: {
    flex: 1,
    padding: 15,
  },
  logText: {
    color: '#A9B7C6',
    fontSize: 13,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
});
