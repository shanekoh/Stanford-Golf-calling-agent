import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Alert, Platform} from 'react-native';
import {
  TextInput,
  Button,
  Switch,
  Text,
  SegmentedButtons,
} from 'react-native-paper';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList, CallStatus} from '../types';
import {useCallStore} from '../store/callStore';
import {requestCallPermission} from '../utils/permissions';
import {
  initiateCall,
  scheduleBackgroundCall,
} from '../services/scheduler';
import ContactPicker from '../components/ContactPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCall'>;

export default function CreateCallScreen({navigation}: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [callMode, setCallMode] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {addCall, updateStatus} = useCallStore();

  const isValidPhone = phoneNumber.replace(/\D/g, '').length >= 7;

  const handleContactSelected = (name: string, phone: string) => {
    setContactName(name);
    setPhoneNumber(phone);
  };

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setScheduledDate(prev => {
        const updated = new Date(date);
        updated.setHours(prev.getHours(), prev.getMinutes());
        return updated;
      });
    }
  };

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      setScheduledDate(prev => {
        const updated = new Date(prev);
        updated.setHours(date.getHours(), date.getMinutes());
        return updated;
      });
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const handleSubmit = async () => {
    if (!isValidPhone) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    setSubmitting(true);

    try {
      if (callMode === 'now') {
        const hasPermission = await requestCallPermission();
        if (!hasPermission) {
          Alert.alert('Permission Denied', 'Call permission is required.');
          setSubmitting(false);
          return;
        }

        const callId = await addCall(
          phoneNumber,
          contactName || null,
          Date.now(),
          CallStatus.COMPLETED,
        );

        const success = await initiateCall(phoneNumber);
        if (!success) {
          await updateStatus(callId, CallStatus.FAILED);
          Alert.alert('Error', 'Could not initiate the call.');
        }
      } else {
        const scheduledTime = scheduledDate.getTime();
        if (scheduledTime <= Date.now()) {
          Alert.alert('Invalid Time', 'Please select a future date and time.');
          setSubmitting(false);
          return;
        }

        const callId = await addCall(
          phoneNumber,
          contactName || null,
          scheduledTime,
          CallStatus.SCHEDULED,
        );

        await scheduleBackgroundCall(
          callId,
          phoneNumber,
          contactName || null,
          scheduledTime,
        );
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="titleMedium" style={styles.label}>
        Phone Number
      </Text>
      <TextInput
        mode="outlined"
        placeholder="Enter phone number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        style={styles.input}
        outlineColor="#1B5E20"
        activeOutlineColor="#1B5E20"
        left={<TextInput.Icon icon="phone" />}
      />

      <ContactPicker onContactSelected={handleContactSelected} />

      {contactName !== '' && (
        <Text variant="bodyMedium" style={styles.contactLabel}>
          Contact: {contactName}
        </Text>
      )}

      <Text variant="titleMedium" style={[styles.label, {marginTop: 24}]}>
        When to Call
      </Text>
      <SegmentedButtons
        value={callMode}
        onValueChange={value => setCallMode(value as 'now' | 'later')}
        buttons={[
          {value: 'now', label: 'Call Now', icon: 'phone'},
          {value: 'later', label: 'Schedule', icon: 'clock-outline'},
        ]}
        style={styles.segmented}
      />

      {callMode === 'later' && (
        <View style={styles.dateTimeSection}>
          <Button
            mode="outlined"
            icon="calendar"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}>
            {formatDate(scheduledDate)}
          </Button>
          <Button
            mode="outlined"
            icon="clock-outline"
            onPress={() => setShowTimePicker(true)}
            style={styles.dateButton}>
            {formatTime(scheduledDate)}
          </Button>

          {showDatePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="time"
              onChange={handleTimeChange}
            />
          )}
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!isValidPhone || submitting}
        style={styles.submitButton}
        buttonColor="#1B5E20"
        icon={callMode === 'now' ? 'phone' : 'clock-check-outline'}>
        {callMode === 'now' ? 'Call Now' : 'Schedule Call'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  label: {
    color: '#1B5E20',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
  },
  contactLabel: {
    marginTop: 8,
    color: '#1B5E20',
    fontStyle: 'italic',
  },
  segmented: {
    marginTop: 4,
  },
  dateTimeSection: {
    marginTop: 16,
    gap: 12,
  },
  dateButton: {
    borderColor: '#1B5E20',
  },
  submitButton: {
    marginTop: 32,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
