import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {
  TextInput,
  Button,
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
  scheduleAIAgentCall,
} from '../services/scheduler';
import ContactPicker from '../components/ContactPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCall'>;

const STANFORD_GOLF_NUMBER = '+14254658948';
const PLAYER_OPTIONS = [
  {value: '1', label: '1'},
  {value: '2', label: '2'},
  {value: '3', label: '3'},
  {value: '4', label: '4'},
];

export default function CreateCallScreen({navigation}: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [callMode, setCallMode] = useState<'now' | 'later' | 'ai'>('now');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI Agent fields
  const [aiPhoneNumber, setAiPhoneNumber] = useState(STANFORD_GOLF_NUMBER);
  const [aiCallTiming, setAiCallTiming] = useState<'now' | 'later'>('now');
  const [aiScheduledDate, setAiScheduledDate] = useState(new Date());
  const [showAiScheduleDatePicker, setShowAiScheduleDatePicker] = useState(false);
  const [showAiScheduleTimePicker, setShowAiScheduleTimePicker] = useState(false);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingTime, setBookingTime] = useState(new Date());
  const [showBookingDatePicker, setShowBookingDatePicker] = useState(false);
  const [showBookingTimePicker, setShowBookingTimePicker] = useState(false);
  const [numPlayers, setNumPlayers] = useState('2');
  const [playerName, setPlayerName] = useState('');

  const {addCall, addAIAgentCall, addScheduledAIAgentCall, updateStatus} = useCallStore();

  const isValidPhone =
    callMode === 'ai'
      ? aiPhoneNumber.replace(/\D/g, '').length >= 7
      : phoneNumber.replace(/\D/g, '').length >= 7;

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

  const handleBookingDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowBookingDatePicker(false);
    if (date) {
      setBookingDate(date);
    }
  };

  const handleBookingTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowBookingTimePicker(false);
    if (date) {
      setBookingTime(date);
    }
  };

  const handleAiScheduleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowAiScheduleDatePicker(false);
    if (date) {
      setAiScheduledDate(prev => {
        const updated = new Date(date);
        updated.setHours(prev.getHours(), prev.getMinutes());
        return updated;
      });
    }
  };

  const handleAiScheduleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowAiScheduleTimePicker(false);
    if (date) {
      setAiScheduledDate(prev => {
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

  const formatBookingDateString = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const handleSubmit = async () => {
    if (!isValidPhone) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    setSubmitting(true);

    try {
      if (callMode === 'ai') {
        const dateStr = formatBookingDateString(bookingDate);
        const timeStr = formatTime(bookingTime);
        const players = parseInt(numPlayers, 10);

        if (aiCallTiming === 'now') {
          const callId = await addAIAgentCall(
            aiPhoneNumber,
            dateStr,
            timeStr,
            players,
            playerName || 'Guest',
          );
          navigation.navigate('CallDetail', {callId});
        } else {
          const scheduledTime = aiScheduledDate.getTime();
          if (scheduledTime <= Date.now()) {
            Alert.alert('Invalid Time', 'Please select a future date and time.');
            setSubmitting(false);
            return;
          }

          const callId = await addScheduledAIAgentCall(
            aiPhoneNumber,
            dateStr,
            timeStr,
            players,
            playerName || 'Guest',
            scheduledTime,
          );

          await scheduleAIAgentCall(
            callId,
            aiPhoneNumber,
            dateStr,
            timeStr,
            players,
            playerName || 'Guest',
            scheduledTime,
          );

          navigation.navigate('CallDetail', {callId});
        }
        return;
      }

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

  const getSubmitLabel = () => {
    if (callMode === 'ai') {
      return aiCallTiming === 'now' ? 'Start AI Booking Call' : 'Schedule AI Call';
    }
    return callMode === 'now' ? 'Call Now' : 'Schedule Call';
  };

  const getSubmitIcon = () => {
    if (callMode === 'ai') {
      return aiCallTiming === 'now' ? 'robot' : 'clock-check-outline';
    }
    return callMode === 'now' ? 'phone' : 'clock-check-outline';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="titleMedium" style={[styles.label, {marginTop: 0}]}>
        Call Mode
      </Text>
      <SegmentedButtons
        value={callMode}
        onValueChange={value => setCallMode(value as 'now' | 'later' | 'ai')}
        buttons={[
          {value: 'now', label: 'Call Now', icon: 'phone'},
          {value: 'later', label: 'Schedule', icon: 'clock-outline'},
          {value: 'ai', label: 'AI Agent', icon: 'robot'},
        ]}
        style={styles.segmented}
      />

      {callMode === 'ai' ? (
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Text variant="titleMedium" style={styles.label}>
              Book a Tee Time
            </Text>
            <Text variant="bodySmall" style={styles.aiSubtitle}>
              AI will call and book for you
            </Text>
          </View>

          <Text variant="bodyMedium" style={styles.fieldLabel}>
            Phone Number to Call
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Enter phone number"
            value={aiPhoneNumber}
            onChangeText={setAiPhoneNumber}
            keyboardType="phone-pad"
            style={styles.input}
            outlineColor="#E65100"
            activeOutlineColor="#E65100"
            left={<TextInput.Icon icon="phone" />}
          />

          <Text variant="bodyMedium" style={[styles.fieldLabel, {marginTop: 16}]}>
            Name for Reservation
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Your name"
            value={playerName}
            onChangeText={setPlayerName}
            style={styles.input}
            outlineColor="#E65100"
            activeOutlineColor="#E65100"
            left={<TextInput.Icon icon="account" />}
          />

          <Text variant="bodyMedium" style={[styles.fieldLabel, {marginTop: 16}]}>
            Booking Date
          </Text>
          <Button
            mode="outlined"
            icon="calendar"
            onPress={() => setShowBookingDatePicker(true)}
            style={styles.aiDateButton}>
            {formatDate(bookingDate)}
          </Button>

          <Text variant="bodyMedium" style={[styles.fieldLabel, {marginTop: 16}]}>
            Preferred Time
          </Text>
          <Button
            mode="outlined"
            icon="clock-outline"
            onPress={() => setShowBookingTimePicker(true)}
            style={styles.aiDateButton}>
            {formatTime(bookingTime)}
          </Button>

          <Text variant="bodyMedium" style={[styles.fieldLabel, {marginTop: 16}]}>
            Number of Players
          </Text>
          <SegmentedButtons
            value={numPlayers}
            onValueChange={setNumPlayers}
            buttons={PLAYER_OPTIONS}
            style={styles.segmented}
          />

          <Text variant="bodyMedium" style={[styles.fieldLabel, {marginTop: 20}]}>
            When to Call
          </Text>
          <SegmentedButtons
            value={aiCallTiming}
            onValueChange={value => setAiCallTiming(value as 'now' | 'later')}
            buttons={[
              {value: 'now', label: 'Call Now', icon: 'phone-outgoing'},
              {value: 'later', label: 'Schedule', icon: 'calendar-clock'},
            ]}
            style={styles.segmented}
          />

          {aiCallTiming === 'later' && (
            <View style={styles.dateTimeSection}>
              <Text variant="bodySmall" style={styles.scheduleHint}>
                The AI agent will place the call at this time
              </Text>
              <Button
                mode="outlined"
                icon="calendar"
                onPress={() => setShowAiScheduleDatePicker(true)}
                style={styles.aiDateButton}>
                {formatDate(aiScheduledDate)}
              </Button>
              <Button
                mode="outlined"
                icon="clock-outline"
                onPress={() => setShowAiScheduleTimePicker(true)}
                style={styles.aiDateButton}>
                {formatTime(aiScheduledDate)}
              </Button>
            </View>
          )}

          {showBookingDatePicker && (
            <DateTimePicker
              value={bookingDate}
              mode="date"
              minimumDate={new Date()}
              onChange={handleBookingDateChange}
            />
          )}
          {showBookingTimePicker && (
            <DateTimePicker
              value={bookingTime}
              mode="time"
              onChange={handleBookingTimeChange}
            />
          )}
          {showAiScheduleDatePicker && (
            <DateTimePicker
              value={aiScheduledDate}
              mode="date"
              minimumDate={new Date()}
              onChange={handleAiScheduleDateChange}
            />
          )}
          {showAiScheduleTimePicker && (
            <DateTimePicker
              value={aiScheduledDate}
              mode="time"
              onChange={handleAiScheduleTimeChange}
            />
          )}
        </View>
      ) : (
        <>
          <Text variant="titleMedium" style={[styles.label, {marginTop: 24}]}>
            Phone Number
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            style={styles.input}
            outlineColor="#8C1515"
            activeOutlineColor="#8C1515"
            left={<TextInput.Icon icon="phone" />}
          />

          <ContactPicker onContactSelected={handleContactSelected} />

          {contactName !== '' && (
            <Text variant="bodyMedium" style={styles.contactLabel}>
              Contact: {contactName}
            </Text>
          )}

          {callMode === 'later' && (
            <View style={styles.dateTimeSection}>
              <Text variant="titleMedium" style={[styles.label, {marginTop: 8}]}>
                Schedule For
              </Text>
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
        </>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!isValidPhone || submitting}
        style={styles.submitButton}
        buttonColor={callMode === 'ai' ? '#E65100' : '#8C1515'}
        icon={getSubmitIcon()}>
        {getSubmitLabel()}
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
    color: '#8C1515',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
  },
  contactLabel: {
    marginTop: 8,
    color: '#8C1515',
    fontStyle: 'italic',
  },
  segmented: {
    marginTop: 4,
  },
  dateTimeSection: {
    marginTop: 12,
    gap: 12,
  },
  dateButton: {
    borderColor: '#8C1515',
  },
  aiDateButton: {
    borderColor: '#E65100',
  },
  submitButton: {
    marginTop: 32,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiSection: {
    marginTop: 24,
  },
  aiHeader: {
    marginBottom: 16,
  },
  aiSubtitle: {
    color: '#888',
    marginTop: 2,
  },
  fieldLabel: {
    color: '#333',
    fontWeight: '500',
    marginBottom: 6,
  },
  scheduleHint: {
    color: '#E65100',
    fontStyle: 'italic',
  },
});
