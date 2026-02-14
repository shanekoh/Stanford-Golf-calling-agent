import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {Button, Text} from 'react-native-paper';
import Contacts from 'react-native-contacts';
import {requestContactsPermission} from '../utils/permissions';

interface ContactItem {
  id: string;
  name: string;
  phone: string;
}

interface ContactPickerProps {
  onContactSelected: (name: string, phoneNumber: string) => void;
}

export default function ContactPicker({onContactSelected}: ContactPickerProps) {
  const [visible, setVisible] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadContacts = async () => {
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Contact permission is required to pick a contact.',
      );
      return;
    }

    setLoading(true);
    try {
      const all = await Contacts.getAll();
      const withPhone: ContactItem[] = [];
      for (const c of all) {
        if (c.phoneNumbers && c.phoneNumbers.length > 0) {
          const name = `${c.givenName || ''} ${c.familyName || ''}`.trim();
          for (const p of c.phoneNumbers) {
            if (p.number) {
              withPhone.push({
                id: `${c.recordID}-${withPhone.length}`,
                name: name || 'Unknown',
                phone: p.number,
              });
            }
          }
        }
      }
      withPhone.sort((a, b) => a.name.localeCompare(b.name));
      setContacts(withPhone);
      setVisible(true);
    } catch {
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q),
    );
  }, [contacts, search]);

  const handleSelect = (contact: ContactItem) => {
    setVisible(false);
    setSearch('');
    onContactSelected(contact.name, contact.phone);
  };

  return (
    <>
      <Button
        mode="outlined"
        icon="contacts"
        onPress={loadContacts}
        loading={loading}
        disabled={loading}
        style={{marginTop: 8}}>
        Pick from Contacts
      </Button>

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => {
          setVisible(false);
          setSearch('');
        }}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Select Contact
            </Text>
            <TouchableOpacity
              onPress={() => {
                setVisible(false);
                setSearch('');
              }}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or number..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{color: '#888'}}>No contacts found</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => handleSelect(item)}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text
                      variant="bodyLarge"
                      style={styles.contactName}
                      numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={styles.contactPhone}
                      numberOfLines={1}>
                      {item.phone}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1B5E20',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#fff',
    fontSize: 16,
  },
  searchInput: {
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '600',
    color: '#333',
  },
  contactPhone: {
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 68,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
