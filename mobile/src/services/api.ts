// FastAPI backend client
// For physical device: use your computer's LAN IP (e.g., 192.168.1.x:8000)
// For Android emulator: use 10.0.2.2:8000
// Use LAN IP so physical devices work without adb reverse
// For emulator: use http://10.0.2.2:8000
const BASE_URL = 'http://10.29.134.150:8000';

export interface ApiCallTask {
  id?: number;
  phone_number: string;
  contact_name: string | null;
  scheduled_time: number;
  status: string;
}

export interface AIAgentCallRequest {
  phone_number: string;
  booking_date: string;
  booking_time: string;
  num_players: number;
  player_name: string;
}

export interface AIAgentCallResponse {
  id: number;
  phone_number: string;
  contact_name: string | null;
  scheduled_time: number;
  status: string;
  created_at: number;
  call_type: string;
  vapi_call_id: string | null;
  booking_date: string | null;
  booking_time: string | null;
  num_players: number | null;
  transcript: string | null;
  booking_confirmed: boolean | null;
  ai_summary: string | null;
}

export async function syncCallToBackend(call: ApiCallTask): Promise<void> {
  try {
    await fetch(`${BASE_URL}/calls`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(call),
    });
  } catch {
    // Backend sync is optional for MVP - fail silently
  }
}

export async function fetchCallsFromBackend(): Promise<ApiCallTask[]> {
  try {
    const response = await fetch(`${BASE_URL}/calls`);
    return await response.json();
  } catch {
    return [];
  }
}

export async function createAIAgentCall(
  request: AIAgentCallRequest,
): Promise<AIAgentCallResponse> {
  const response = await fetch(`${BASE_URL}/calls/ai-agent`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Server error ${response.status}`);
  }
  return response.json();
}

export async function pollCallStatus(
  callId: number,
): Promise<AIAgentCallResponse> {
  const response = await fetch(`${BASE_URL}/calls/${callId}/status`);
  if (!response.ok) {
    throw new Error(`Server error ${response.status}`);
  }
  return response.json();
}

export async function refreshCallFromVapi(
  callId: number,
): Promise<AIAgentCallResponse> {
  const response = await fetch(`${BASE_URL}/calls/${callId}/refresh`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Server error ${response.status}`);
  }
  return response.json();
}
