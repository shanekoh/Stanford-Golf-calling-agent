export enum CallStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum CallType {
  MANUAL = 'MANUAL',
  AI_AGENT = 'AI_AGENT',
}

export interface CallTask {
  id: number;
  phoneNumber: string;
  contactName: string | null;
  scheduledTime: number; // Unix timestamp in ms
  status: CallStatus;
  createdAt: number; // Unix timestamp in ms
  callType: CallType;
  vapiCallId: string | null;
  bookingDate: string | null;
  bookingTime: string | null;
  numPlayers: number | null;
  playerName: string | null;
  transcript: string | null;
  bookingConfirmed: boolean | null;
  aiSummary: string | null;
}

export type RootStackParamList = {
  Dashboard: undefined;
  CreateCall: undefined;
  CallDetail: {callId: number};
};
