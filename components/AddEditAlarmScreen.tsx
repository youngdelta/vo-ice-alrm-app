import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAlarms } from '@/context/AlarmContext';
import { Alarm } from '@/types/alarm';

interface AddEditAlarmScreenProps {
  alarmId?: string;
  onClose: () => void;
  onSave?: () => void;
}

export const AddEditAlarmScreen: React.FC<AddEditAlarmScreenProps> = ({
  alarmId,
  onClose,
  onSave,
}) => {
  const { addAlarm, updateAlarm, getAlarmById } = useAlarms();
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (alarmId) {
      const alarm = getAlarmById(alarmId);
      if (alarm) {
        setMessage(alarm.message);
        // 날짜와 시간 파싱
        const [year, month, day] = alarm.date.split('-');
        const [hours, minutes] = alarm.time.split(':');
        const alarmDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        const alarmTime = new Date();
        alarmTime.setHours(parseInt(hours), parseInt(minutes), 0);
        setDate(alarmDate);
        setTime(alarmTime);
      }
    }
  }, [alarmId, getAlarmById]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const handleSave = async () => {
    if (!message.trim()) {
      Alert.alert('오류', '메시지를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const timeString = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

      if (alarmId) {
        await updateAlarm(alarmId, {
          message,
          date: dateString,
          time: timeString,
        });
      } else {
        const newAlarm: Alarm = {
          id: Date.now().toString(),
          time: timeString,
          date: dateString,
          message,
          enabled: true,
          createdAt: Date.now(),
        };
        await addAlarm(newAlarm);
      }

      onSave?.();
      onClose();
    } catch (error) {
      Alert.alert('오류', '알람 저장에 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelBtn}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {alarmId ? '알람 편집' : '새 알람'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveBtn, loading && styles.disabledBtn]}>
            저장
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>메시지</Text>
        <TextInput
          style={styles.input}
          placeholder="알람 메시지를 입력하세요"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>날짜</Text>
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>시간</Text>
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            is24Hour={true}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelBtn: {
    fontSize: 16,
    color: '#666',
  },
  saveBtn: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
});
