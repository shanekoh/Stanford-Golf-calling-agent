import React from 'react';
import {Chip} from 'react-native-paper';
import {CallStatus} from '../types';

interface StatusBadgeProps {
  status: CallStatus;
}

const STATUS_CONFIG: Record<CallStatus, {label: string; color: string; icon: string}> = {
  [CallStatus.SCHEDULED]: {label: 'Scheduled', color: '#1565C0', icon: 'clock-outline'},
  [CallStatus.COMPLETED]: {label: 'Completed', color: '#2E7D32', icon: 'check-circle-outline'},
  [CallStatus.FAILED]: {label: 'Failed', color: '#C62828', icon: 'alert-circle-outline'},
  [CallStatus.CANCELLED]: {label: 'Cancelled', color: '#757575', icon: 'close-circle-outline'},
};

export default function StatusBadge({status}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Chip
      icon={config.icon}
      mode="flat"
      compact
      style={{backgroundColor: config.color + '20'}}
      textStyle={{color: config.color, fontSize: 12}}>
      {config.label}
    </Chip>
  );
}
