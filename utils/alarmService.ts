import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Audio } from 'expo-av';
import { Alarm } from '../types/alarm';
import { alarmStorage } from './alarmStorage';

const ALARM_TASK_NAME = 'VOICE_ALARM_TASK';
let currentAlarmSound: Audio.Sound | null = null;
let isAlarmPlaying = false;
let alarmInterval: NodeJS.Timeout | null = null;
let currentAlarmId: string | null = null;

// 알림 설정
export const initializeNotifications = async () => {
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // 권한 요청
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
};

// 배경 작업 등록
export const registerBackgroundTask = () => {
  TaskManager.defineTask(ALARM_TASK_NAME, async () => {
    try {
      const alarms = await alarmStorage.getAlarms();
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDate = now.toISOString().split('T')[0];

      for (const alarm of alarms) {
        if (
          alarm.enabled &&
          alarm.time === currentTime &&
          alarm.date === currentDate &&
          !alarm.isActive
        ) {
          // 알람 활성화
          await alarmStorage.updateAlarm(alarm.id, { isActive: true });
          
          // 알림 발송
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '알람',
              body: alarm.message,
              sound: true,
              badge: 1,
            },
            trigger: null,
          });

          // 음성 재생 시작
          startAlarmSound(alarm);
        }
      }

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error('Error in background task:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
};

// 배경 작업 시작
export const startBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(ALARM_TASK_NAME, {
      minimumInterval: 1 * 60, // 1분마다 확인
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background task registered');
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
};

// 배경 작업 중지
export const stopBackgroundTask = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(ALARM_TASK_NAME);
  } catch (error) {
    console.error('Failed to unregister background task:', error);
  }
};

// 음성 재생 시작
export const startAlarmSound = async (alarm: Alarm) => {
  if (isAlarmPlaying) {
    return;
  }

  try {
    currentAlarmId = alarm.id;
    
    // 오디오 모드 설정
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    isAlarmPlaying = true;

    // 음성 재생 반복
    const playAlarmVoice = async () => {
      try {
        if (!isAlarmPlaying || currentAlarmId !== alarm.id) return;

        // 콘솔에 로깅 (실제 TTS는 expo-speech이 필요함)
        console.log(`🔔 Playing alarm message: ${alarm.message}`);
        
        // 알림 소리 재생 (시스템 사운드)
        // 원하는 경우 커스텀 사운드 파일을 로드할 수 있습니다.

        // 5초마다 반복 재생
        if (isAlarmPlaying && currentAlarmId === alarm.id) {
          alarmInterval = setTimeout(playAlarmVoice, 5000) as any;
        }
      } catch (error) {
        console.error('Error playing alarm voice:', error);
      }
    };

    playAlarmVoice();
  } catch (error) {
    console.error('Failed to start alarm sound:', error);
    isAlarmPlaying = false;
  }
};

// 음성 재생 중지
export const stopAlarmSound = async (alarmId: string) => {
  try {
    isAlarmPlaying = false;
    currentAlarmId = null;

    if (alarmInterval) {
      clearTimeout(alarmInterval);
      alarmInterval = null;
    }

    if (currentAlarmSound) {
      await currentAlarmSound.stopAsync();
      await currentAlarmSound.unloadAsync();
      currentAlarmSound = null;
    }

    // 알람 비활성화
    await alarmStorage.updateAlarm(alarmId, { isActive: false });

    // 오디오 모드 복구
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    console.log('Alarm stopped');
  } catch (error) {
    console.error('Failed to stop alarm sound:', error);
  }
};

// 알람이 활성화되었는지 확인
export const getActiveAlarm = async (): Promise<Alarm | null> => {
  const alarms = await alarmStorage.getAlarms();
  return alarms.find(a => a.isActive) || null;
};
