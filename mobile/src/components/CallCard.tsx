import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Card, Text, IconButton} from 'react-native-paper';
import {CallTask, CallStatus, CallType} from '../types';
import StatusBadge from './StatusBadge';

interface CallCardProps {
  call: CallTask;
  onPress: (call: CallTask) => void;
  onCancel: (call: CallTask) => void;
  onDelete: (call: CallTask) => void;
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function CallCard({call, onPress, onCancel, onDelete}: CallCardProps) {
  const isUpcoming = call.status === CallStatus.SCHEDULED;
  const isAI = call.callType === CallType.AI_AGENT;

  return (
    <TouchableOpacity onPress={() => onPress(call)} activeOpacity={0.7}>
      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.content}>
          <View style={styles.leftSection}>
            <View style={styles.nameRow}>
              <Text variant="titleMedium" style={styles.name}>
                {call.contactName || call.phoneNumber}
              </Text>
              {isAI && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              )}
            </View>
            {call.contactName && (
              <Text variant="bodySmall" style={styles.phone}>
                {call.phoneNumber}
              </Text>
            )}
            {isAI && call.bookingDate ? (
              <Text variant="bodySmall" style={styles.time}>
                {call.bookingDate} at {call.bookingTime} - {call.numPlayers} player{(call.numPlayers || 0) !== 1 ? 's' : ''}
              </Text>
            ) : (
              <Text variant="bodySmall" style={styles.time}>
                {formatDateTime(call.scheduledTime)}
              </Text>
            )}
          </View>
          <View style={styles.rightSection}>
            <StatusBadge status={call.status} />
            <View style={styles.actions}>
              {isUpcoming && (
                <IconButton
                  icon="close-circle-outline"
                  size={20}
                  iconColor="#C62828"
                  onPress={() => onCancel(call)}
                />
              )}
              <IconButton
                icon="delete-outline"
                size={20}
                iconColor="#757575"
                onPress={() => onDelete(call)}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#fff',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontWeight: '600',
    color: '#8C1515',
  },
  aiBadge: {
    backgroundColor: '#E65100',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  phone: {
    color: '#666',
    marginTop: 2,
  },
  time: {
    color: '#888',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 4,
  },
});
