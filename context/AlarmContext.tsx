import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alarm, AlarmContextType } from '../types/alarm';
import { alarmStorage } from '../utils/alarmStorage';

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const AlarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    const loadAlarms = async () => {
      try {
        const savedAlarms = await alarmStorage.getAlarms();
        setAlarms(savedAlarms);
      } catch (error) {
        console.error('Failed to load alarms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlarms();
  }, []);

  const addAlarm = async (alarm: Alarm) => {
    try {
      await alarmStorage.addAlarm(alarm);
      setAlarms(prev => [...prev, alarm]);
    } catch (error) {
      console.error('Failed to add alarm:', error);
      throw error;
    }
  };

  const updateAlarm = async (id: string, updates: Partial<Alarm>) => {
    try {
      await alarmStorage.updateAlarm(id, updates);
      setAlarms(prev =>
        prev.map(alarm =>
          alarm.id === id ? { ...alarm, ...updates } : alarm
        )
      );
    } catch (error) {
      console.error('Failed to update alarm:', error);
      throw error;
    }
  };

  const deleteAlarm = async (id: string) => {
    try {
      await alarmStorage.deleteAlarm(id);
      setAlarms(prev => prev.filter(alarm => alarm.id !== id));
    } catch (error) {
      console.error('Failed to delete alarm:', error);
      throw error;
    }
  };

  const toggleAlarm = async (id: string) => {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
      await updateAlarm(id, { enabled: !alarm.enabled });
    }
  };

  const getAlarmById = (id: string) => {
    return alarms.find(a => a.id === id);
  };

  const value: AlarmContextType = {
    alarms,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    getAlarmById,
  };

  return (
    <AlarmContext.Provider value={value}>
      {children}
    </AlarmContext.Provider>
  );
};

export const useAlarms = () => {
  const context = useContext(AlarmContext);
  if (context === undefined) {
    throw new Error('useAlarms must be used within an AlarmProvider');
  }
  return context;
};
