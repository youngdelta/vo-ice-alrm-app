import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlarms } from '@/context/AlarmContext';
import { Alarm } from '@/types/alarm';
import { AddEditAlarmScreen } from './AddEditAlarmScreen';
import { stopAlarmSound } from '@/utils/alarmService';

export const AlarmListScreen: React.FC = () => {
  const { alarms, deleteAlarm, toggleAlarm } = useAlarms();
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null);
  const [isAddEditVisible, setIsAddEditVisible] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  const handleDeleteAlarm = (alarmId: string) => {
    Alert.alert('알람 삭제', '이 알람을 삭제하시겠습니까?', [
      {
        text: '취소',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: '삭제',
        onPress: async () => {
          await deleteAlarm(alarmId);
        },
        style: 'destructive',
      },
    ]);
  };

  const handleStopAlarm = async (alarmId: string) => {
    await stopAlarmSound(alarmId);
  };

  const handleEditAlarm = (alarmId: string) => {
    setEditingAlarmId(alarmId);
    setIsAddEditVisible(true);
  };

  const handleAddNewAlarm = () => {
    setEditingAlarmId(null);
    setIsAddEditVisible(true);
  };

  const renderAlarmItem = ({ item }: { item: Alarm }) => (
    <View style={styles.alarmItem}>
      <View style={styles.alarmInfo}>
        <View>
          <Text style={styles.alarmTime}>{item.time}</Text>
          <Text style={styles.alarmDate}>{item.date}</Text>
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.alarmMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
      </View>
      <View style={styles.controls}>
        {item.isActive && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => handleStopAlarm(item.id)}
          >
            <Ionicons name="stop-circle" size={32} color="#FF3B30" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditAlarm(item.id)}
        >
          <Ionicons name="create" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteAlarm(item.id)}
        >
          <Ionicons name="trash" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleAlarm(item.id)}
          style={styles.toggle}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>알람</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNewAlarm}
        >
          <Ionicons name="add-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {alarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alarm" size={64} color="#ccc" />
          <Text style={styles.emptyText}>등록된 알람이 없습니다.</Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={handleAddNewAlarm}
          >
            <Text style={styles.emptyAddButtonText}>알람 추가</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={alarms}
          renderItem={renderAlarmItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={alarms.length > 0}
        />
      )}

      <Modal
        visible={isAddEditVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setIsAddEditVisible(false)}
      >
        <AddEditAlarmScreen
          alarmId={editingAlarmId ?? undefined}
          onClose={() => setIsAddEditVisible(false)}
          onSave={() => {}}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    padding: 12,
  },
  alarmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alarmInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  alarmTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  alarmDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  messageContainer: {
    flex: 1,
    marginLeft: 8,
  },
  alarmMessage: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopButton: {
    padding: 4,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  toggle: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptyAddButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
