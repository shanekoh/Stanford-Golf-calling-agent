import notifee, {EventType} from '@notifee/react-native';
import {initiateCall} from './scheduler';
import {updateCallStatus} from '../db/database';
import {CallStatus} from '../types';

export async function setupNotificationHandlers(): Promise<void> {
  // Handle notification press when app is in foreground
  notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.PRESS && detail.notification?.data) {
      const {phoneNumber, callId} = detail.notification.data as {
        phoneNumber: string;
        callId: string;
      };
      handleCallNotificationPress(phoneNumber, Number(callId));
    }
  });

  // Handle notification press when app is in background
  notifee.onBackgroundEvent(async ({type, detail}) => {
    if (type === EventType.PRESS && detail.notification?.data) {
      const {phoneNumber, callId} = detail.notification.data as {
        phoneNumber: string;
        callId: string;
      };
      await handleCallNotificationPress(phoneNumber, Number(callId));
    }
  });
}

async function handleCallNotificationPress(
  phoneNumber: string,
  callId: number,
): Promise<void> {
  try {
    const success = await initiateCall(phoneNumber);
    if (success) {
      await updateCallStatus(callId, CallStatus.COMPLETED);
    } else {
      await updateCallStatus(callId, CallStatus.FAILED);
    }
  } catch {
    await updateCallStatus(callId, CallStatus.FAILED);
  }
}
