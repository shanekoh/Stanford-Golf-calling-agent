import {create} from 'zustand';
import {CallTask, CallStatus} from '../types';
import * as db from '../db/database';
import {createAIAgentCall, pollCallStatus as apiPollStatus} from '../services/api';

interface CallStore {
  calls: CallTask[];
  loading: boolean;
  loadCalls: () => Promise<void>;
  addCall: (
    phoneNumber: string,
    contactName: string | null,
    scheduledTime: number,
    status?: CallStatus,
  ) => Promise<number>;
  addAIAgentCall: (
    phoneNumber: string,
    bookingDate: string,
    bookingTime: string,
    numPlayers: number,
    playerName: string,
  ) => Promise<number>;
  addScheduledAIAgentCall: (
    phoneNumber: string,
    bookingDate: string,
    bookingTime: string,
    numPlayers: number,
    playerName: string,
    scheduledTime: number,
  ) => Promise<number>;
  updateAICallResult: (callId: number) => Promise<void>;
  updateStatus: (id: number, status: CallStatus) => Promise<void>;
  removeCall: (id: number) => Promise<void>;
}

export const useCallStore = create<CallStore>((set, get) => ({
  calls: [],
  loading: false,

  loadCalls: async () => {
    set({loading: true});
    const calls = await db.getAllCalls();
    set({calls, loading: false});
  },

  addCall: async (phoneNumber, contactName, scheduledTime, status) => {
    const id = await db.insertCall(
      phoneNumber,
      contactName,
      scheduledTime,
      status,
    );
    await get().loadCalls();
    return id;
  },

  addAIAgentCall: async (phoneNumber, bookingDate, bookingTime, numPlayers, playerName) => {
    // Insert locally first
    const localId = await db.insertAIAgentCall(
      phoneNumber,
      bookingDate,
      bookingTime,
      numPlayers,
      playerName,
    );

    try {
      // Call the backend to initiate the Vapi call
      const response = await createAIAgentCall({
        phone_number: phoneNumber,
        booking_date: bookingDate,
        booking_time: bookingTime,
        num_players: numPlayers,
        player_name: playerName,
      });

      // Update local record with vapi_call_id from backend
      await db.updateAICallResult(
        localId,
        CallStatus.IN_PROGRESS,
        null,
        null,
        null,
        response.vapi_call_id,
      );
    } catch (error) {
      await db.updateAICallResult(
        localId,
        CallStatus.FAILED,
        null,
        false,
        `Failed to start AI call: ${error}`,
        null,
      );
    }

    await get().loadCalls();
    return localId;
  },

  addScheduledAIAgentCall: async (phoneNumber, bookingDate, bookingTime, numPlayers, playerName, scheduledTime) => {
    const localId = await db.insertScheduledAIAgentCall(
      phoneNumber,
      bookingDate,
      bookingTime,
      numPlayers,
      playerName,
      scheduledTime,
    );
    await get().loadCalls();
    return localId;
  },

  updateAICallResult: async (callId: number) => {
    try {
      const result = await apiPollStatus(callId);
      const status = result.status as CallStatus;
      if (
        status === CallStatus.COMPLETED ||
        status === CallStatus.FAILED
      ) {
        await db.updateAICallResult(
          callId,
          status,
          result.transcript,
          result.booking_confirmed,
          result.ai_summary,
          result.vapi_call_id,
        );
      }
    } catch {
      // Polling failure — ignore, retry next cycle
    }
    await get().loadCalls();
  },

  updateStatus: async (id, status) => {
    await db.updateCallStatus(id, status);
    await get().loadCalls();
  },

  removeCall: async (id) => {
    await db.deleteCall(id);
    await get().loadCalls();
  },
}));
