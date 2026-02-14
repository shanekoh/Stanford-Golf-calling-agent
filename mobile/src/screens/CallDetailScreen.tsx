import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {Text, Button, Card, Divider} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList, CallTask, CallStatus} from '../types';
import {getCallById} from '../db/database';
import {useCallStore} from '../store/callStore';
import {initiateCall, cancelScheduledNotification} from '../services/scheduler';
import {requestCallPermission} from '../utils/permissions';
import StatusBadge from '../components/StatusBadge';

type Props = NativeStackScreenProps<RootStackParamList, 'CallDetail'>;

function formatFullDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function CallDetailScreen({route, navigation}: Props) {
  const {callId} = route.params;
  const [call, setCall] = useState<CallTask | null>(null);
  const {updateStatus, removeCall} = useCallStore();

  useEffect(() => {
    getCallById(callId).then(setCall);
  }, [callId]);

  if (!call) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const isScheduled = call.status === CallStatus.SCHEDULED;

  const handleCallNow = async () => {
    const hasPermission = await requestCallPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Call permission is required.');
      return;
    }
    const success = await initiateCall(call.phoneNumber);
    if (success) {
      await updateStatus(call.id, CallStatus.COMPLETED);
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Could not initiate the call.');
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Call', 'Are you sure you want to cancel this call?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await cancelScheduledNotification(call.id);
          await updateStatus(call.id, CallStatus.CANCELLED);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Call', 'Remove this call permanently?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeCall(call.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.name}>
              {call.contactName || 'Unknown Contact'}
            </Text>
            <StatusBadge status={call.status} />
          </View>

          <Divider style={styles.divider} />

          <DetailRow label="Phone Number" value={call.phoneNumber} />
          <DetailRow
            label="Scheduled For"
            value={formatFullDateTime(call.scheduledTime)}
          />
          <DetailRow
            label="Created"
            value={formatFullDateTime(call.createdAt)}
          />
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        {isScheduled && (
          <>
            <Button
              mode="contained"
              icon="phone"
              onPress={handleCallNow}
              buttonColor="#1B5E20"
              style={styles.actionButton}>
              Call Now
            </Button>
            <Button
              mode="outlined"
              icon="close-circle-outline"
              onPress={handleCancel}
              textColor="#C62828"
              style={styles.actionButton}>
              Cancel Call
            </Button>
          </>
        )}
        <Button
          mode="text"
          icon="delete-outline"
          onPress={handleDelete}
          textColor="#757575"
          style={styles.actionButton}>
          Delete
        </Button>
      </View>
    </View>
  );
}

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.detailRow}>
      <Text variant="labelMedium" style={styles.detailLabel}>
        {label}
      </Text>
      <Text variant="bodyLarge">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    color: '#1B5E20',
    fontWeight: '700',
    flex: 1,
  },
  divider: {
    marginVertical: 12,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    color: '#888',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
});
