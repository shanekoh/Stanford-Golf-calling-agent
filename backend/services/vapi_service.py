import httpx
from config import VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, SERVER_BASE_URL

VAPI_BASE_URL = "https://api.vapi.ai"


def build_system_prompt(date: str, time: str, players: int, player_name: str) -> str:
    return (
        f"You are a polite phone assistant calling Stanford Golf Course to book a tee time.\n"
        f"Book: {date} at {time} for {players} player{'s' if players != 1 else ''} under the name {player_name}.\n"
        f"- If the exact time is unavailable, accept the closest available time\n"
        f"- Confirm the details back including any confirmation number\n"
        f"- If you reach voicemail, leave a message with the booking request and hang up\n"
        f"- Never agree to charges beyond the standard tee time fee\n"
        f"- Be concise and professional"
    )


async def create_vapi_outbound_call(
    phone: str, date: str, time: str, players: int, call_id: int, player_name: str = "Guest"
) -> dict:
    payload = {
        "phoneNumberId": VAPI_PHONE_NUMBER_ID,
        "customer": {"number": phone},
        "assistant": {
            "model": {
                "provider": "openai",
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "system",
                        "content": build_system_prompt(date, time, players, player_name),
                    }
                ],
            },
            "voice": {
                "provider": "lmnt",
                "voiceId": "ec126bc2-46e0-4c66-a730-2889cc6cad8d",
            },
            "firstMessage": (
                f"Hi, I'd like to book a tee time for {players} "
                f"player{'s' if players != 1 else ''} on {date} at {time}, please. "
                f"The reservation would be under the name {player_name}."
            ),
            "endCallMessage": "Thank you, goodbye!",
            "analysisPlan": {
                "structuredDataPrompt": (
                    "Extract the following from the call:\n"
                    "- booking_confirmed: boolean\n"
                    "- confirmed_date: string or null\n"
                    "- confirmed_time: string or null\n"
                    "- confirmation_number: string or null"
                ),
                "structuredDataSchema": {
                    "type": "object",
                    "properties": {
                        "booking_confirmed": {"type": "boolean"},
                        "confirmed_date": {"type": "string"},
                        "confirmed_time": {"type": "string"},
                        "confirmation_number": {"type": "string"},
                    },
                },
                "summaryPrompt": (
                    "Summarize the call outcome in 1-2 sentences. "
                    "Include whether the tee time was booked and any key details."
                ),
            },
            "serverUrl": f"{SERVER_BASE_URL}/webhooks/vapi",
        },
        "metadata": {"call_id": str(call_id)},
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{VAPI_BASE_URL}/call",
            json=payload,
            headers={
                "Authorization": f"Bearer {VAPI_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()


async def get_vapi_call(vapi_call_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{VAPI_BASE_URL}/call/{vapi_call_id}",
            headers={"Authorization": f"Bearer {VAPI_API_KEY}"},
            timeout=15.0,
        )
        response.raise_for_status()
        return response.json()
