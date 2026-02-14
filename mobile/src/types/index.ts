export enum CallStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface CallTask {
  id: number;
  phoneNumber: string;
  contactName: string | null;
  scheduledTime: number; // Unix timestamp in ms
  status: CallStatus;
  createdAt: number; // Unix timestamp in ms
}

export type RootStackParamList = {
  Dashboard: undefined;
  CreateCall: undefined;
  CallDetail: {callId: number};
};
