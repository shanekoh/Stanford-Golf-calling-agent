import React, {useEffect, useState, useRef, useCallback} from 'react';
import {View, StyleSheet, Alert, ScrollView, ActivityIndicator} from 'react-native';
import {Text, Button, Card, Divider} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList, CallTask, CallStatus, CallType} from '../types';
import {getCallById} from '../db/database';
import {useCallStore} from '../store/callStore';
import {initiateCall, cancelScheduledNotification} from '../services/scheduler';
import {requestCallPermission} from '../utils/permissions';
import {pollCallStatusByVapi, refreshCallByVapi} from '../services/api';
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
  const {updateStatus, updateAICallResult, removeCall} = useCallStore();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadCall = useCallback(async () => {
    const loaded = await getCallById(callId);
    setCall(loaded);
    return loaded;
  }, [callId]);

  // Initial load
  useEffect(() => {
    loadCall();
  }, [loadCall]);

  // Auto-fetch transcript for completed/failed AI calls that don't have it yet
  useEffect(() => {
    if (!call) return;
    if (call.callType !== CallType.AI_AGENT) return;
    if (call.status !== CallStatus.COMPLETED && call.status !== CallStatus.FAILED) return;
    if (call.transcript || call.aiSummary) return;
    if (!call.vapiCallId) return;

    const fetchTranscript = async () => {
      try {
        await refreshCallByVapi(call.vapiCallId!);
        await updateAICallResult(call.id, call.vapiCallId!);
        await loadCall();
      } catch {
        // Will show Fetch Transcript button as fallback
      }
    };
    fetchTranscript();
  }, [call?.id, call?.status, call?.callType, call?.transcript, call?.aiSummary, call?.vapiCallId, loadCall, updateAICallResult]);

  // Poll for AI call status updates
  useEffect(() => {
    if (!call) return;
    if (call.callType !== CallType.AI_AGENT) return;
    if (call.status !== CallStatus.IN_PROGRESS) return;
    if (!call.vapiCallId) return;

    const vapiId = call.vapiCallId;

    pollingRef.current = setInterval(async () => {
      try {
        const result = await pollCallStatusByVapi(vapiId);
        const status = result.status as CallStatus;
        if (status === CallStatus.COMPLETED || status === CallStatus.FAILED) {
          await updateAICallResult(callId, vapiId);
          await loadCall();
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch {
        // Polling failure — will retry next interval
      }
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [call?.status, call?.callType, call?.vapiCallId, callId, loadCall, updateAICallResult]);

  if (!call) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const isScheduled = call.status === CallStatus.SCHEDULED;
  const isInProgress = call.status === CallStatus.IN_PROGRESS;
  const isAI = call.callType === CallType.AI_AGENT;
  const isDone =
    call.status === CallStatus.COMPLETED || call.status === CallStatus.FAILED;

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

  const handleRefresh = async () => {
    if (!call?.vapiCallId) {
      Alert.alert('Error', 'No Vapi call ID available.');
      return;
    }
    try {
      await refreshCallByVapi(call.vapiCallId);
      await updateAICallResult(callId, call.vapiCallId);
      await loadCall();
    } catch {
      Alert.alert('Error', 'Could not refresh call status from Vapi.');
    }
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
    <ScrollView style={styles.container}>
      {/* Result Banner for AI calls */}
      {isAI && isDone && (
        <View
          style={[
            styles.banner,
            call.bookingConfirmed ? styles.bannerSuccess : styles.bannerFail,
          ]}>
          <Text style={styles.bannerText}>
            {call.bookingConfirmed
              ? 'Tee Time Booked!'
              : 'Booking Not Confirmed'}
          </Text>
        </View>
      )}

      {/* In-progress spinner for AI calls */}
      {isAI && isInProgress && (
        <View style={styles.progressSection}>
          <ActivityIndicator size="large" color="#E65100" />
          <Text variant="titleMedium" style={styles.progressText}>
            AI Agent is calling...
          </Text>
          <Text variant="bodySmall" style={styles.progressSubtext}>
            The AI is speaking with Stanford Golf Course
          </Text>
        </View>
      )}

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

          {isAI && call.bookingDate && (
            <>
              <DetailRow label="Booking Date" value={call.bookingDate} />
              <DetailRow label="Preferred Time" value={call.bookingTime || ''} />
              <DetailRow
                label="Players"
                value={`${call.numPlayers} player${(call.numPlayers || 0) !== 1 ? 's' : ''}`}
              />
            </>
          )}

          {isAI && isScheduled && (
            <DetailRow
              label="AI Call Scheduled For"
              value={formatFullDateTime(call.scheduledTime)}
            />
          )}

          {!isAI && (
            <DetailRow
              label="Scheduled For"
              value={formatFullDateTime(call.scheduledTime)}
            />
          )}

          <DetailRow
            label="Created"
            value={formatFullDateTime(call.createdAt)}
          />
        </Card.Content>
      </Card>

      {/* AI Summary */}
      {isAI && call.aiSummary && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              AI Summary
            </Text>
            <Text variant="bodyMedium">{call.aiSummary}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Transcript */}
      {isAI && call.transcript && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Call Transcript
            </Text>
            <Text variant="bodySmall" style={styles.transcript}>
              {call.transcript}
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.actions}>
        {isScheduled && !isAI && (
          <>
            <Button
              mode="contained"
              icon="phone"
              onPress={handleCallNow}
              buttonColor="#8C1515"
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
        {isAI && isScheduled && (
          <Button
            mode="outlined"
            icon="close-circle-outline"
            onPress={handleCancel}
            textColor="#C62828"
            style={styles.actionButton}>
            Cancel Scheduled Call
          </Button>
        )}
        {isAI && (isInProgress || (isDone && !call.transcript)) && (
          <Button
            mode="outlined"
            icon="refresh"
            onPress={handleRefresh}
            textColor="#E65100"
            style={styles.actionButton}>
            {isInProgress ? 'Refresh Status' : 'Fetch Transcript'}
          </Button>
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
    </ScrollView>
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
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    color: '#8C1515',
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
    marginTop: 12,
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    borderRadius: 8,
  },
  banner: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  bannerSuccess: {
    backgroundColor: '#E8F5E9',
  },
  bannerFail: {
    backgroundColor: '#FFEBEE',
  },
  bannerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 12,
  },
  progressText: {
    color: '#E65100',
    fontWeight: '600',
    marginTop: 12,
  },
  progressSubtext: {
    color: '#888',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#8C1515',
    fontWeight: '600',
    marginBottom: 8,
  },
  transcript: {
    color: '#444',
    lineHeight: 20,
  },
});
