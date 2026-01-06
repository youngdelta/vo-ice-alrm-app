import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActiveAlarm, stopAlarmSound } from '@/utils/alarmService';
import { Alarm } from '@/types/alarm';

interface AlarmAlertProps {
  visible: boolean;
  onStopAlarm: (alarmId: string) => void;
}

export const AlarmAlert: React.FC<AlarmAlertProps> = ({
  visible,
  onStopAlarm,
}) => {
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const slideAnim = new Animated.Value(Dimensions.get('window').height);

  useEffect(() => {
    const checkActiveAlarm = async () => {
      const activeAlarm = await getActiveAlarm();
      setAlarm(activeAlarm);
    };

    if (visible) {
      checkActiveAlarm();
      const interval = setInterval(checkActiveAlarm, 1000);
      
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      return () => clearInterval(interval);
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleStop = async () => {
    if (alarm) {
      await stopAlarmSound(alarm.id);
      onStopAlarm(alarm.id);
    }
  };

  if (!alarm) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="alarm" size={64} color="#FF3B30" />
        </View>
        
        <Text style={styles.title}>알람</Text>
        
        <Text style={styles.message} numberOfLines={3}>
          {alarm.message}
        </Text>

        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStop}
          activeOpacity={0.8}
        >
          <Ionicons name="stop-circle" size={48} color="#fff" />
          <Text style={styles.stopButtonText}>정지</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    minHeight: 250,
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: '#FFE5E0',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
});
