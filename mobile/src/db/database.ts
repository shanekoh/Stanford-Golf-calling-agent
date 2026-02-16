import SQLite from 'react-native-sqlite-storage';
import {CallTask, CallStatus, CallType} from '../types';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

function rowToCallTask(row: any): CallTask {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    contactName: row.contact_name,
    scheduledTime: row.scheduled_time,
    status: row.status as CallStatus,
    createdAt: row.created_at,
    callType: (row.call_type as CallType) || CallType.MANUAL,
    vapiCallId: row.vapi_call_id || null,
    bookingDate: row.booking_date || null,
    bookingTime: row.booking_time || null,
    numPlayers: row.num_players || null,
    playerName: row.player_name || null,
    transcript: row.transcript || null,
    bookingConfirmed: row.booking_confirmed != null ? !!row.booking_confirmed : null,
    aiSummary: row.ai_summary || null,
  };
}

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
      created_at INTEGER NOT NULL,
      call_type TEXT NOT NULL DEFAULT 'MANUAL',
      vapi_call_id TEXT,
      booking_date TEXT,
      booking_time TEXT,
      num_players INTEGER,
      player_name TEXT,
      transcript TEXT,
      booking_confirmed INTEGER,
      ai_summary TEXT
    )
  `);
  // Migration: add new columns to existing tables
  const migrations = [
    "ALTER TABLE calls ADD COLUMN call_type TEXT NOT NULL DEFAULT 'MANUAL'",
    'ALTER TABLE calls ADD COLUMN vapi_call_id TEXT',
    'ALTER TABLE calls ADD COLUMN booking_date TEXT',
    'ALTER TABLE calls ADD COLUMN booking_time TEXT',
    'ALTER TABLE calls ADD COLUMN num_players INTEGER',
    'ALTER TABLE calls ADD COLUMN transcript TEXT',
    'ALTER TABLE calls ADD COLUMN booking_confirmed INTEGER',
    'ALTER TABLE calls ADD COLUMN ai_summary TEXT',
    'ALTER TABLE calls ADD COLUMN player_name TEXT',
  ];
  for (const sql of migrations) {
    try {
      await db.executeSql(sql);
    } catch {
      // Column already exists — ignore
    }
  }
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

export async function insertAIAgentCall(
  phoneNumber: string,
  bookingDate: string,
  bookingTime: string,
  numPlayers: number,
  playerName: string,
): Promise<number> {
  const database = await getDatabase();
  const now = Date.now();
  const [result] = await database.executeSql(
    `INSERT INTO calls (phone_number, contact_name, scheduled_time, status, created_at,
     call_type, booking_date, booking_time, num_players, player_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      phoneNumber,
      'Stanford Golf Course',
      now,
      CallStatus.IN_PROGRESS,
      now,
      CallType.AI_AGENT,
      bookingDate,
      bookingTime,
      numPlayers,
      playerName,
    ],
  );
  return result.insertId;
}

export async function insertScheduledAIAgentCall(
  phoneNumber: string,
  bookingDate: string,
  bookingTime: string,
  numPlayers: number,
  playerName: string,
  scheduledTime: number,
): Promise<number> {
  const database = await getDatabase();
  const now = Date.now();
  const [result] = await database.executeSql(
    `INSERT INTO calls (phone_number, contact_name, scheduled_time, status, created_at,
     call_type, booking_date, booking_time, num_players, player_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      phoneNumber,
      'AI Scheduled Call',
      scheduledTime,
      CallStatus.SCHEDULED,
      now,
      CallType.AI_AGENT,
      bookingDate,
      bookingTime,
      numPlayers,
      playerName,
    ],
  );
  return result.insertId;
}

export async function updateAICallResult(
  id: number,
  status: CallStatus,
  transcript: string | null,
  bookingConfirmed: boolean | null,
  aiSummary: string | null,
  vapiCallId: string | null,
): Promise<void> {
  const database = await getDatabase();
  await database.executeSql(
    `UPDATE calls SET status = ?, transcript = ?, booking_confirmed = ?,
     ai_summary = ?, vapi_call_id = ? WHERE id = ?`,
    [status, transcript, bookingConfirmed ? 1 : 0, aiSummary, vapiCallId, id],
  );
}

export async function getAllCalls(): Promise<CallTask[]> {
  const database = await getDatabase();
  const [result] = await database.executeSql(
    'SELECT * FROM calls ORDER BY scheduled_time DESC',
  );
  const calls: CallTask[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    calls.push(rowToCallTask(result.rows.item(i)));
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
  return rowToCallTask(result.rows.item(0));
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
