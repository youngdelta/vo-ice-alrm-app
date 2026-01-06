# 음성 알람 앱 개발 문서

## 개요

이 문서는 Expo로 구현된 음성 알람 애플리케이션의 기술적 세부사항을 설명합니다.

## 아키텍처

### 1. 상태 관리 (Context)

**파일**: `context/AlarmContext.tsx`

- **AlarmContext**: React Context를 사용한 전역 상태 관리
- **AlarmProvider**: 앱 전체에서 알람 상태 접근 가능
- **useAlarms**: 커스텀 훅으로 Context 접근

```typescript
interface AlarmContextType {
  alarms: Alarm[];
  addAlarm: (alarm: Alarm) => Promise<void>;
  updateAlarm: (id: string, alarm: Partial<Alarm>) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  getAlarmById: (id: string) => Alarm | undefined;
}
```

### 2. 데이터 저장

**파일**: `utils/alarmStorage.ts`

- **AsyncStorage**: React Native AsyncStorage를 사용한 로컬 데이터 저장
- 모든 알람 데이터는 `@voice_alarm_app_alarms` 키로 저장됨
- CRUD 작업 제공 (Create, Read, Update, Delete)

```typescript
export const alarmStorage = {
  async getAlarms(): Promise<Alarm[]>,
  async saveAlarms(alarms: Alarm[]): Promise<void>,
  async addAlarm(alarm: Alarm): Promise<void>,
  async updateAlarm(id: string, updates: Partial<Alarm>): Promise<void>,
  async deleteAlarm(id: string): Promise<void>,
  async getAlarmById(id: string): Promise<Alarm | null>,
  async clearAll(): Promise<void>,
};
```

### 3. 알람 서비스

**파일**: `utils/alarmService.ts`

#### 3.1 알림 초기화
- `initializeNotifications()`: 시스템 알림 핸들러 설정 및 권한 요청
- iOS와 Android 모두에서 알림 권한 요청

#### 3.2 백그라운드 작업
- `registerBackgroundTask()`: 백그라운드 작업 정의
- `startBackgroundTask()`: 배경 작업 시작 (1분 주기)
- `stopBackgroundTask()`: 배경 작업 중지

**동작 원리**:
1. 1분마다 현재 시간과 등록된 알람 시간 비교
2. 일치하는 활성화된 알람 찾기
3. 알람 활성화 및 알림 발송
4. 음성 재생 시작

#### 3.3 음성 재생
- `startAlarmSound(alarm)`: 알람 음성 재생 시작
- `stopAlarmSound(alarmId)`: 알람 음성 재생 중지
- 5초 간격으로 반복 재생

**오디오 설정**:
```typescript
await Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,      // 무음 모드에서도 재생
  staysActiveInBackground: true,    // 백그라운드에서 계속 재생
  shouldDuckAndroid: false,
  playThroughEarpieceAndroid: false,
});
```

## UI 컴포넌트

### 1. AlarmListScreen

**파일**: `components/AlarmListScreen.tsx`

- 등록된 모든 알람 목록 표시
- 알람 활성화/비활성화 토글
- 알람 편집 기능
- 알람 삭제 기능
- 알람 정지 기능 (활성 알람만 표시)

**주요 기능**:
- FlatList를 사용한 효율적인 렌더링
- 각 알람 항목에서 시간, 날짜, 메시지 표시
- 스위치를 통한 on/off 제어

### 2. AddEditAlarmScreen

**파일**: `components/AddEditAlarmScreen.tsx`

- 새 알람 추가 또는 기존 알람 편집
- 날짜 선택기 (DateTimePicker)
- 시간 선택기
- 메시지 입력 필드

**특징**:
- iOS와 Android 모두 지원
- 검증: 메시지 입력 필수
- 모달 형태로 표시

### 3. AlarmAlert

**파일**: `components/AlarmAlert.tsx`

- 활성 알람 표시
- 화면 하단에서 슬라이드 업으로 나타남
- 큰 정지 버튼 제공
- 1초마다 활성 알람 상태 갱신

**애니메이션**:
- Animated API를 사용한 슬라이드 업 효과
- 부드러운 전환

## 데이터 구조

### Alarm 인터페이스

```typescript
interface Alarm {
  id: string;              // 고유 ID (타임스탬프)
  time: string;           // HH:mm 형식
  date: string;           // YYYY-MM-DD 형식
  message: string;        // 알람 메시지
  enabled: boolean;       // 활성화 상태
  createdAt: number;      // 생성 시간 (타임스탬프)
  isActive?: boolean;     // 현재 재생 중 여부
}
```

## 플로우 다이어그램

### 알람 생성 플로우
```
사용자 입력
    ↓
AddEditAlarmScreen 검증
    ↓
AlarmContext.addAlarm()
    ↓
alarmStorage.saveAlarms()
    ↓
AsyncStorage에 저장
    ↓
AlarmListScreen 갱신
```

### 백그라운드 알람 플로우
```
BackgroundFetch (1분 주기)
    ↓
registerBackgroundTask() 실행
    ↓
현재 시간과 비교
    ↓
일치하는 활성 알람 찾기
    ↓
알람 활성화
    ↓
Notifications 발송
    ↓
startAlarmSound() 호출
    ↓
5초 간격 반복
    ↓
사용자가 정지 버튼 클릭
    ↓
stopAlarmSound() 호출
```

## 설정 (app.json)

### iOS 권한
```json
"infoPlist": {
  "NSMicrophoneUsageDescription": "음성 알람을 위해 마이크 권한이 필요합니다.",
  "UIBackgroundModes": ["audio", "fetch"]
}
```

### Android 권한
```json
"permissions": [
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.RECORD_AUDIO",
  "android.permission.POST_NOTIFICATIONS"
]
```

## 알람 검사 주기

현재 구현은 1분마다 백그라운드에서 활성 알람을 확인합니다. 이는 정확도와 배터리 사용량의 균형을 맞춘 설정입니다.

```typescript
minimumInterval: 1 * 60  // 1분 = 60초
```

더 정확한 알람이 필요하면 주기를 줄일 수 있지만, 배터리 소비가 증가합니다.

## 보안 고려사항

1. **민감한 데이터**: 현재 메시지는 암호화되지 않고 저장됩니다.
   필요시 encryption 라이브러리 추가 가능.

2. **권한 관리**: 필요한 권한만 요청하고 있습니다.

3. **입력 검증**: 메시지 입력 필드의 검증 구현됨.

## 성능 최적화

1. **FlatList**: 대량의 알람 목록에서 효율적인 렌더링
2. **AsyncStorage**: 로컬 저장으로 네트워크 호출 없음
3. **백그라운드 작업**: 1분 주기로 배터리 소비 최소화
4. **Context**: 필요한 컴포넌트만 리렌더링

## 테스트 가이드

### 단위 테스트
```bash
npm test
```

### 기능 테스트 체크리스트
- [ ] 알람 추가 가능
- [ ] 알람 편집 가능
- [ ] 알람 삭제 가능
- [ ] 알람 활성화/비활성화 가능
- [ ] 지정된 시간에 알람 울림
- [ ] 백그라운드에서도 알람 울림
- [ ] 정지 버튼으로 알람 정지
- [ ] 앱 재시작 후에도 알람 유지

## 문제 해결

### 1. 백그라운드 알람이 작동하지 않음
**원인**: 배터리 최적화로 인해 백그라운드 작업 제한

**해결책**:
- 앱을 배터리 최적화 제외 목록에 추가
- Android: 설정 > 배터리 > 배터리 최적화 제외
- iOS: 설정 > 배터리 > 배터리 절약 모드 해제

### 2. 알림이 표시되지 않음
**원인**: 알림 권한 미허용

**해결책**:
- `initializeNotifications()`에서 권한 재요청
- 기기 설정에서 앱 알림 권한 확인

### 3. 알람이 정확하지 않음
**원인**: 1분 주기로 확인하므로 최대 1분 오차 발생 가능

**해결책**:
- `minimumInterval` 값 감소 (배터리 소비 증가)
- 더 정확한 타이밍이 필요하면 다른 방식 고려

## 향후 개선 계획

1. **TTS 통합**: expo-speech 또는 다른 TTS 라이브러리
2. **반복 알람**: 매일, 매주 등의 반복 설정
3. **스누즈**: 5분 후 다시 울림 기능
4. **알람 분류**: 카테고리별 관리
5. **커스텀 사운드**: 사용자가 지정한 사운드 재생
6. **알람 통계**: 사용 통계 및 분석

## 참고 자료

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Background Fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [Expo Task Manager](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [React Context API](https://react.dev/reference/react/useContext)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
