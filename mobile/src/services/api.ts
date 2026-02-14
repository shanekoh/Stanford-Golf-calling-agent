// FastAPI backend client - placeholder for future AI agent integration
const BASE_URL = 'http://10.0.2.2:8000'; // Android emulator localhost

export interface ApiCallTask {
  id?: number;
  phone_number: string;
  contact_name: string | null;
  scheduled_time: number;
  status: string;
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
