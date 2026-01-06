export interface Alarm {
  id: string;
  time: string; // HH:mm format
  date: string; // YYYY-MM-DD format
  message: string;
  enabled: boolean;
  createdAt: number;
  isActive?: boolean;
}

export interface AlarmContextType {
  alarms: Alarm[];
  addAlarm: (alarm: Alarm) => Promise<void>;
  updateAlarm: (id: string, alarm: Partial<Alarm>) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  getAlarmById: (id: string) => Alarm | undefined;
}
