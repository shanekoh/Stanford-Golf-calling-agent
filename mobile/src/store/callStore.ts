import {create} from 'zustand';
import {CallTask, CallStatus, CallType} from '../types';
import * as db from '../db/database';
import {createAIAgentCall, pollCallStatusByVapi, refreshCallByVapi} from '../services/api';

interface CallStore {
  calls: CallTask[];
  loading: boolean;
  loadCalls: () => Promise<void>;
  syncInProgressCalls: () => Promise<void>;
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
  updateAICallResult: (callId: number, vapiCallId: string) => Promise<void>;
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

  syncInProgressCalls: async () => {
    const allCalls = await db.getAllCalls();
    const inProgress = allCalls.filter(
      c => c.callType === CallType.AI_AGENT &&
           c.status === CallStatus.IN_PROGRESS &&
           c.vapiCallId,
    );
    for (const call of inProgress) {
      try {
        await refreshCallByVapi(call.vapiCallId!);
        const result = await pollCallStatusByVapi(call.vapiCallId!);
        const status = result.status as CallStatus;
        if (status === CallStatus.COMPLETED || status === CallStatus.FAILED) {
          await db.updateAICallResult(
            call.id,
            status,
            result.transcript || null,
            result.booking_confirmed ?? null,
            result.ai_summary || null,
            result.vapi_call_id || call.vapiCallId,
          );
        }
      } catch {
        // Skip this call, try next
      }
    }
    const updated = await db.getAllCalls();
    set({calls: updated});
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

  updateAICallResult: async (callId: number, vapiCallId: string) => {
    try {
      // First try to refresh from Vapi to ensure backend has latest data
      try {
        await refreshCallByVapi(vapiCallId);
      } catch {
        // Refresh failed (Vapi may not be ready yet) — continue with poll
      }
      const result = await pollCallStatusByVapi(vapiCallId);
      const status = result.status as CallStatus;
      if (
        status === CallStatus.COMPLETED ||
        status === CallStatus.FAILED
      ) {
        await db.updateAICallResult(
          callId,
          status,
          result.transcript || null,
          result.booking_confirmed ?? null,
          result.ai_summary || null,
          result.vapi_call_id || vapiCallId,
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
