import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text as RNText,
  StyleSheet,
  RefreshControl,
  Alert,
  SectionList,
  TouchableOpacity,
} from 'react-native';
// react-native-paper Text unused for now, using RNText directly
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useCallStore} from '../store/callStore';
import {CallTask, CallStatus, RootStackParamList} from '../types';
import CallCard from '../components/CallCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({navigation}: Props) {
  const [error, setError] = useState<string | null>(null);
  const {calls, loading, loadCalls, syncInProgressCalls, updateStatus, removeCall} = useCallStore();

  useEffect(() => {
    loadCalls()
      .then(() => syncInProgressCalls())
      .catch(e => {
        console.error('Failed to load calls:', e);
        setError(String(e));
      });
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCalls()
        .then(() => syncInProgressCalls())
        .catch(e => console.error('Failed to load calls:', e));
    });
    return unsubscribe;
  }, [navigation, loadCalls, syncInProgressCalls]);

  const sections = useMemo(() => {
    const active = calls.filter(
      c => c.status === CallStatus.SCHEDULED || c.status === CallStatus.IN_PROGRESS,
    );
    const past = calls.filter(
      c => c.status !== CallStatus.SCHEDULED && c.status !== CallStatus.IN_PROGRESS,
    );
    const result = [];
    if (active.length > 0) {
      result.push({title: 'Active', data: active});
    }
    if (past.length > 0) {
      result.push({title: 'History', data: past});
    }
    return result;
  }, [calls]);

  const handlePress = useCallback(
    (call: CallTask) => {
      navigation.navigate('CallDetail', {callId: call.id});
    },
    [navigation],
  );

  const handleCancel = useCallback(
    (call: CallTask) => {
      Alert.alert('Cancel Call', `Cancel the call to ${call.contactName || call.phoneNumber}?`, [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => updateStatus(call.id, CallStatus.CANCELLED),
        },
      ]);
    },
    [updateStatus],
  );

  const handleDelete = useCallback(
    (call: CallTask) => {
      Alert.alert('Delete Call', 'Remove this call from history?', [
        {text: 'No', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeCall(call.id),
        },
      ]);
    },
    [removeCall],
  );

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <RNText style={{fontSize: 18, color: 'red'}}>Error: {error}</RNText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sections.length === 0 && !loading ? (
        <View style={styles.empty}>
          <RNText style={styles.emptyTitle}>No calls yet</RNText>
          <RNText style={styles.emptySubtitle}>
            Tap + to schedule your first call
          </RNText>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => String(item.id)}
          renderItem={({item}) => (
            <CallCard
              call={item}
              onPress={handlePress}
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          )}
          renderSectionHeader={({section: {title}}) => (
            <RNText style={styles.sectionHeader}>{title}</RNText>
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => loadCalls().then(() => syncInProgressCalls())} />
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{height: 2}} />}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateCall')}
        activeOpacity={0.8}>
        <RNText style={styles.fabText}>+</RNText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  list: {
    paddingBottom: 80,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 14,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#8C1515',
    marginBottom: 8,
    fontSize: 22,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#8C1515',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
});
