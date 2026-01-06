import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '../types/alarm';

const ALARMS_KEY = '@voice_alarm_app_alarms';

export const alarmStorage = {
  async getAlarms(): Promise<Alarm[]> {
    try {
      const data = await AsyncStorage.getItem(ALARMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading alarms:', error);
      return [];
    }
  },

  async saveAlarms(alarms: Alarm[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
    } catch (error) {
      console.error('Error saving alarms:', error);
    }
  },

  async addAlarm(alarm: Alarm): Promise<void> {
    const alarms = await this.getAlarms();
    alarms.push(alarm);
    await this.saveAlarms(alarms);
  },

  async updateAlarm(id: string, updates: Partial<Alarm>): Promise<void> {
    const alarms = await this.getAlarms();
    const index = alarms.findIndex(a => a.id === id);
    if (index !== -1) {
      alarms[index] = { ...alarms[index], ...updates };
      await this.saveAlarms(alarms);
    }
  },

  async deleteAlarm(id: string): Promise<void> {
    const alarms = await this.getAlarms();
    const filtered = alarms.filter(a => a.id !== id);
    await this.saveAlarms(filtered);
  },

  async getAlarmById(id: string): Promise<Alarm | null> {
    const alarms = await this.getAlarms();
    return alarms.find(a => a.id === id) || null;
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ALARMS_KEY);
    } catch (error) {
      console.error('Error clearing alarms:', error);
    }
  },
};
