import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AlarmListScreen } from '@/components/AlarmListScreen';
import { AlarmAlert } from '@/components/AlarmAlert';
import { useAlarms } from '@/context/AlarmContext';
import { initializeNotifications, registerBackgroundTask, startBackgroundTask, getActiveAlarm } from '@/utils/alarmService';

export default function HomeScreen() {
  const { alarms } = useAlarms();
  const [showAlarm, setShowAlarm] = useState(false);

  useEffect(() => {
    const setupAlarmService = async () => {
      try {
        // 알림 초기화
        await initializeNotifications();
        
        // 배경 작업 등록
        registerBackgroundTask();
        
        // 배경 작업 시작
        await startBackgroundTask();
        
        // 활성 알람 확인
        const activeAlarm = await getActiveAlarm();
        setShowAlarm(!!activeAlarm);
        
        console.log('Alarm service initialized');
      } catch (error) {
        console.error('Failed to initialize alarm service:', error);
      }
    };

    setupAlarmService();

    // 활성 알람 주기적 확인
    const interval = setInterval(async () => {
      const activeAlarm = await getActiveAlarm();
      setShowAlarm(!!activeAlarm);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStopAlarm = () => {
    setShowAlarm(false);
  };

  return (
    <View style={styles.container}>
      <AlarmListScreen />
      <AlarmAlert visible={showAlarm} onStopAlarm={handleStopAlarm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
