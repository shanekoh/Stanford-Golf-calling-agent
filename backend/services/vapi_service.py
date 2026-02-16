import httpx
from config import VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, SERVER_BASE_URL

VAPI_BASE_URL = "https://api.vapi.ai"


def build_system_prompt(date: str, time: str, players: int, player_name: str) -> str:
    return (
        f"You are calling on behalf of Shane to book a tee time at Stanford Golf Course. "
        f"Be polite, friendly, and brief — like a real person making a quick phone call.\n\n"
        f"BOOKING REQUEST:\n"
        f"- Date: {date}\n"
        f"- Preferred time: {time}\n"
        f"- Players: {players}\n"
        f"- Name: {player_name}\n\n"
        f"INSTRUCTIONS:\n"
        f"1. Request the tee time above. If that exact time is not available, ask what the closest available time is and accept it.\n"
        f"2. Ask them to send an email confirmation to Shane.\n"
        f"3. Once they confirm the email will be sent, thank them and end the call immediately. Do not repeat or re-confirm the booking details.\n"
        f"4. If they ask for an email address, provide it only if Shane has given one — otherwise say Shane will call back with it.\n"
        f"5. If you reach voicemail, leave a brief message with the booking request and ask them to call back.\n"
        f"6. Do not agree to any charges beyond the standard greens fee.\n\n"
        f"Keep your responses short — one or two sentences at a time. Do not over-explain or ramble."
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
                f"Hi there, I'm calling on behalf of Shane to book a tee time. "
                f"We're looking for {date} around {time} for {players} "
                f"player{'s' if players != 1 else ''}. Is that available?"
            ),
            "endCallMessage": "Perfect, thank you so much. Have a great day!",
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
