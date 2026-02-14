import {Linking} from 'react-native';
import notifee, {
  TriggerType,
  TimestampTrigger,
  EventType,
  Event,
} from '@notifee/react-native';
import {updateCallStatus} from '../db/database';
import {CallStatus} from '../types';

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
      data: {callId: String(callId), phoneNumber},
    },
    trigger,
  );

  return notificationId;
}

export async function cancelScheduledNotification(
  callId: number,
): Promise<void> {
  await notifee.cancelNotification(`call-${callId}`);
}

export async function scheduleBackgroundCall(
  callId: number,
  phoneNumber: string,
  contactName: string | null,
  scheduledTime: number,
): Promise<void> {
  await scheduleCallNotification(callId, phoneNumber, contactName, scheduledTime);
}

/**
 * Register notifee event handlers for foreground and background events.
 * Call this once at app startup (e.g., in index.js).
 */
export function setupNotificationHandlers(): void {
  // Foreground events
  notifee.onForegroundEvent(async ({type, detail}: Event) => {
    if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
      const actionId = detail.pressAction?.id;
      const data = detail.notification?.data;

      if (actionId === 'make-call' && data?.phoneNumber) {
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
      if (data?.callId) {
        await updateCallStatus(Number(data.callId), CallStatus.COMPLETED);
      }
    }
  });
}

/**
 * Background event handler — must be registered at the top level (index.js).
 */
export function backgroundEventHandler({type, detail}: Event): Promise<void> {
  return (async () => {
    if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
      const actionId = detail.pressAction?.id;
      const data = detail.notification?.data;

      if (actionId === 'make-call' && data?.phoneNumber) {
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
      if (data?.callId) {
        await updateCallStatus(Number(data.callId), CallStatus.COMPLETED);
      }
    }
  })();
}
