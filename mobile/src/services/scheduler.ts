import {Linking} from 'react-native';
import notifee, {
  TriggerType,
  TimestampTrigger,
  EventType,
  Event,
} from '@notifee/react-native';
import {updateCallStatus, updateAICallResult} from '../db/database';
import {CallStatus} from '../types';
import {createAIAgentCall} from './api';

export async function initiateCall(phoneNumber: string): Promise<boolean> {
  const url = `tel:${phoneNumber}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return true;
  }
  return false;
}

export async function scheduleCallNotification(
  callId: number,
  phoneNumber: string,
  contactName: string | null,
  scheduledTime: number,
): Promise<string> {
  const channelId = await notifee.createChannel({
    id: 'scheduled-calls',
    name: 'Scheduled Calls',
    sound: 'default',
    importance: 4, // HIGH
  });

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: scheduledTime,
    alarmManager: {allowWhileIdle: true},
  };

  const notificationId = await notifee.createTriggerNotification(
    {
      id: `call-${callId}`,
      title: 'Scheduled Call',
      body: `Time to call ${contactName || phoneNumber}`,
      android: {
        channelId,
        pressAction: {id: 'make-call'},
        smallIcon: 'ic_launcher',
        importance: 4,
        actions: [
          {
            title: 'Call Now',
            pressAction: {id: 'make-call'},
          },
          {
            title: 'Dismiss',
            pressAction: {id: 'dismiss'},
          },
        ],
      },
      data: {callId: String(callId), phoneNumber, callType: 'MANUAL'},
    },
    trigger,
  );

  return notificationId;
}

export async function scheduleAIAgentCall(
  callId: number,
  phoneNumber: string,
  bookingDate: string,
  bookingTime: string,
  numPlayers: number,
  playerName: string,
  scheduledTime: number,
): Promise<string> {
  const channelId = await notifee.createChannel({
    id: 'ai-agent-calls',
    name: 'AI Agent Calls',
    sound: 'default',
    importance: 4,
  });

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: scheduledTime,
    alarmManager: {allowWhileIdle: true},
  };

  const notificationId = await notifee.createTriggerNotification(
    {
      id: `ai-call-${callId}`,
      title: 'AI Agent Call Starting',
      body: `Booking tee time: ${bookingDate} at ${bookingTime} for ${numPlayers} player${numPlayers !== 1 ? 's' : ''}`,
      android: {
        channelId,
        pressAction: {id: 'start-ai-call'},
        smallIcon: 'ic_launcher',
        importance: 4,
        actions: [
          {
            title: 'Start AI Call',
            pressAction: {id: 'start-ai-call'},
          },
          {
            title: 'Cancel',
            pressAction: {id: 'dismiss'},
          },
        ],
      },
      data: {
        callId: String(callId),
        phoneNumber,
        callType: 'AI_AGENT',
        bookingDate,
        bookingTime,
        numPlayers: String(numPlayers),
        playerName,
      },
    },
    trigger,
  );

  return notificationId;
}

export async function cancelScheduledNotification(
  callId: number,
): Promise<void> {
  await notifee.cancelNotification(`call-${callId}`);
  await notifee.cancelNotification(`ai-call-${callId}`);
}

export async function scheduleBackgroundCall(
  callId: number,
  phoneNumber: string,
  contactName: string | null,
  scheduledTime: number,
): Promise<void> {
  await scheduleCallNotification(callId, phoneNumber, contactName, scheduledTime);
}

async function handleAICallTrigger(data: Record<string, string>): Promise<void> {
  const callId = Number(data.callId);
  const phoneNumber = data.phoneNumber;
  const bookingDate = data.bookingDate;
  const bookingTime = data.bookingTime;
  const numPlayers = Number(data.numPlayers);
  const playerName = data.playerName;

  try {
    const response = await createAIAgentCall({
      phone_number: phoneNumber,
      booking_date: bookingDate,
      booking_time: bookingTime,
      num_players: numPlayers,
      player_name: playerName,
    });

    await updateAICallResult(
      callId,
      CallStatus.IN_PROGRESS,
      null,
      null,
      null,
      response.vapi_call_id,
    );
  } catch (error) {
    await updateAICallResult(
      callId,
      CallStatus.FAILED,
      null,
      false,
      `Failed to start AI call: ${error}`,
      null,
    );
  }
}

async function handleNotificationEvent(type: number, detail: any): Promise<void> {
  if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
    const actionId = detail.pressAction?.id;
    const data = detail.notification?.data;

    if (actionId === 'start-ai-call' && data?.callType === 'AI_AGENT') {
      await handleAICallTrigger(data as Record<string, string>);
    } else if (actionId === 'make-call' && data?.phoneNumber) {
      const callId = Number(data.callId);
      const phoneNumber = String(data.phoneNumber);
      try {
        await initiateCall(phoneNumber);
        await updateCallStatus(callId, CallStatus.COMPLETED);
      } catch {
        await updateCallStatus(callId, CallStatus.FAILED);
      }
    }

    if (actionId === 'dismiss' && data?.callId) {
      await updateCallStatus(Number(data.callId), CallStatus.CANCELLED);
    }

    if (detail.notification?.id) {
      await notifee.cancelNotification(detail.notification.id);
    }
  }

  if (type === EventType.DELIVERED) {
    const data = detail.notification?.data;
    if (data?.callType === 'AI_AGENT' && data?.callId) {
      // Auto-trigger AI call when notification is delivered (fires at scheduled time)
      await handleAICallTrigger(data as Record<string, string>);
    } else if (data?.callId) {
      await updateCallStatus(Number(data.callId), CallStatus.COMPLETED);
    }
  }
}

/**
 * Register notifee event handlers for foreground and background events.
 * Call this once at app startup (e.g., in index.js).
 */
export function setupNotificationHandlers(): void {
  notifee.onForegroundEvent(async ({type, detail}: Event) => {
    await handleNotificationEvent(type, detail);
  });
}

/**
 * Background event handler — must be registered at the top level (index.js).
 */
export function backgroundEventHandler({type, detail}: Event): Promise<void> {
  return handleNotificationEvent(type, detail);
}
