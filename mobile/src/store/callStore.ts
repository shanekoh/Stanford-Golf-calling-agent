import {create} from 'zustand';
import {CallTask, CallStatus} from '../types';
import * as db from '../db/database';

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

  updateStatus: async (id, status) => {
    await db.updateCallStatus(id, status);
    await get().loadCalls();
  },

  removeCall: async (id) => {
    await db.deleteCall(id);
    await get().loadCalls();
  },
}));
