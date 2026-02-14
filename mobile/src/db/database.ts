import SQLite from 'react-native-sqlite-storage';
import {CallTask, CallStatus} from '../types';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabase({
    name: 'stanford_golf_calls.db',
    location: 'default',
  });
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT NOT NULL,
      contact_name TEXT,
      scheduled_time INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT '${CallStatus.SCHEDULED}',
      created_at INTEGER NOT NULL
    )
  `);
  return db;
}

export async function insertCall(
  phoneNumber: string,
  contactName: string | null,
  scheduledTime: number,
  status: CallStatus = CallStatus.SCHEDULED,
): Promise<number> {
  const database = await getDatabase();
  const now = Date.now();
  const [result] = await database.executeSql(
    'INSERT INTO calls (phone_number, contact_name, scheduled_time, status, created_at) VALUES (?, ?, ?, ?, ?)',
    [phoneNumber, contactName, scheduledTime, status, now],
  );
  return result.insertId;
}

export async function getAllCalls(): Promise<CallTask[]> {
  const database = await getDatabase();
  const [result] = await database.executeSql(
    'SELECT * FROM calls ORDER BY scheduled_time DESC',
  );
  const calls: CallTask[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);
    calls.push({
      id: row.id,
      phoneNumber: row.phone_number,
      contactName: row.contact_name,
      scheduledTime: row.scheduled_time,
      status: row.status as CallStatus,
      createdAt: row.created_at,
    });
  }
  return calls;
}

export async function getCallById(id: number): Promise<CallTask | null> {
  const database = await getDatabase();
  const [result] = await database.executeSql(
    'SELECT * FROM calls WHERE id = ?',
    [id],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows.item(0);
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    contactName: row.contact_name,
    scheduledTime: row.scheduled_time,
    status: row.status as CallStatus,
    createdAt: row.created_at,
  };
}

export async function updateCallStatus(
  id: number,
  status: CallStatus,
): Promise<void> {
  const database = await getDatabase();
  await database.executeSql('UPDATE calls SET status = ? WHERE id = ?', [
    status,
    id,
  ]);
}

export async function deleteCall(id: number): Promise<void> {
  const database = await getDatabase();
  await database.executeSql('DELETE FROM calls WHERE id = ?', [id]);
}
