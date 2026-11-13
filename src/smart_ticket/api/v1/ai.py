import os
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
import httpx
from smart_ticket.core.database import get_session
from smart_ticket.core.security import get_current_user
from smart_ticket.models import (
    Profile, UserRole, Incident, KnowledgeArticle, AIConversation, AIMessage
)
from pydantic import BaseModel

from dotenv import load_dotenv
load_dotenv()

import re

def clean_markdown_formatting(text: str) -> str:
    """
    Cleans raw markdown formatting (asterisks, hashtags, underscores, extra bullets)
    so the assistant's output renders in clean, human-readable prose.
    """
    if not text:
        return ""
    # 1. Remove markdown horizontal rules (--- or ***)
    cleaned = re.sub(r'^[ \t]*[-*_]{3,}[ \t]*$', '', text, flags=re.MULTILINE)
    # 2. Remove bold/italic asterisks (**bold** -> bold, *italic* -> italic)
    cleaned = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', cleaned)
    # 3. Remove bold/italic underscores (__bold__ -> bold, _italic_ -> italic)
    cleaned = re.sub(r'_{1,3}(.*?)_{1,3}', r'\1', cleaned)
    # 4. Remove header hashtags (# Title -> Title)
    cleaned = re.sub(r'^[ \t]*#{1,6}\s*', '', cleaned, flags=re.MULTILINE)
    # 5. Convert any bullet points (* or - or +) into clean Unicode dots
    cleaned = re.sub(r'^[ \t]*[*–—\-+]\s*', '• ', cleaned, flags=re.MULTILINE)
    # 6. Ensure lines that were headers don't have leading bullet dots
    cleaned = re.sub(r'^•\s*(Step-by-Step|Recommended|Guide|Note|Important|Overview|Instructions|Checklist)', r'\1', cleaned, flags=re.MULTILINE)
    # 6. Clean any leftover trailing or dangling asterisks
    cleaned = cleaned.replace('*', '')
    # 7. Reduce consecutive newlines to maximum 2
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()


router = APIRouter(prefix="/ai", tags=["Generative AI Support Assistant"])


class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[uuid.UUID] = None


class TicketSummaryRequest(BaseModel):
    incident_id: uuid.UUID


class TroubleshootingRequest(BaseModel):
    query: str
    category: Optional[str] = None


async def call_gemini_api(prompt: str, system_instruction: str = "") -> str:
    """
    Calls Google Gemini REST API using httpx with environment-configured key.
    Falls back gracefully to deterministic ITSM intelligence if key is unconfigured.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()
    
    if api_key and not api_key.startswith("YOUR_"):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    print(f"Gemini API returned HTTP {res.status_code}: {res.text[:300]}")
        except Exception as e:
            print(f"Gemini API request failed: {e}")

    # Authoritative Fallback / Offline Response Generator
    return generate_offline_ai_response(prompt, system_instruction)


def generate_offline_ai_response(prompt: str, context: str) -> str:
    lower = prompt.lower()
    if "vpn" in lower:
        return (
            "**VPN Access Guide & Resolution Steps:**\n\n"
            "1. **Confirm Gateway Reachability**: Verify your internet connection by accessing https://status.smartticket.local.\n"
            "2. **Client Configuration**: Open the Cisco AnyConnect / IKEv2 client and set the host to `vpn.smartticket.local`.\n"
            "3. **MFA Token**: Ensure your Authenticator app time synchronization is correct.\n"
            "4. **Need a Service Request?**: If your account lacks VPN entitlement, navigate to **Service Catalogue > Corporate VPN Access** to submit a formal access request with manager approval."
        )
    elif "restart" in lower or "crash" in lower or "blue screen" in lower:
        return (
            "**Automatic Restart / Crash Diagnostic Checklist:**\n\n"
            "- Check Windows Event Viewer under `System` logs for BugCheck / Kernel-Power events.\n"
            "- Update DisplayPort and Thunderbolt docking station drivers.\n"
            "- Check system thermals and fan vents for obstruction.\n\n"
            "*Would you like me to draft an incident report for Hardware Support?*"
        )
    elif "password" in lower or "reset" in lower or "login" in lower:
        return (
            "**Identity & Access Self-Service:**\n\n"
            "Password resets can be self-administered via the enterprise self-service recovery portal. "
            "For privileged role elevation or database access, submit an entry in **Service Catalogue > System Permission & Role Elevation**."
        )
    else:
        return (
            f"Thank you for contacting the IT Service Desk Assistant.\n\n"
            f"Based on your query regarding \"{prompt.strip()}\", I recommend checking the approved articles in the **Knowledge Base** or reporting an incident if this is currently degrading your productivity.\n\n"
            "• Incident Creation: Click **Report Incident** in the sidebar.\n"
            "• Service Requests: Submit requests for hardware, VPN, or software licenses in the **Service Catalogue**."
        )


@router.post("/chat")
async def chat_with_assistant(
    payload: ChatMessageRequest,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Retrieve or create conversation
    conv_id = payload.conversation_id
    if not conv_id:
        conv = AIConversation(
            user_id=current_user.id,
            title=payload.message[:45] + ("..." if len(payload.message) > 45 else "")
        )
        session.add(conv)
        session.commit()
        session.refresh(conv)
        conv_id = conv.id
    else:
        conv = session.get(AIConversation, conv_id)
        if not conv or conv.user_id != current_user.id:
            conv = AIConversation(user_id=current_user.id, title="Support Session")
            session.add(conv)
            session.commit()
            session.refresh(conv)
            conv_id = conv.id

    # 2. Record User Message
    user_msg = AIMessage(
        conversation_id=conv_id,
        role="user",
        content=payload.message
    )
    session.add(user_msg)
    session.commit()

    # 3. Build Context (Knowledge Base grounding)
    kb_articles = session.exec(select(KnowledgeArticle)).all()
    kb_context = "\n".join([f"- Title: {a.title} | Category: {a.category} | Content: {a.content[:200]}" for a in kb_articles[:5]])

    system_instruction = (
        f"You are the Smart IT Service Desk Assistant powered by Google Gemini. "
        f"You assist enterprise employees (current user: {current_user.full_name}, role: {current_user.role}).\n"
        f"Formatting and Style Instructions:\n"
        f"- Do NOT use markdown symbols like asterisks (* or **), hashtags (#, ##, ###), or underscores (_).\n"
        f"- Do NOT produce raw markdown formatting that clutters prose.\n"
        f"- Format titles and section headings cleanly on their own lines in plain text with capital letters or colons.\n"
        f"- For lists, use simple numbers (1., 2., 3.) or clean bullet points (• ) with clear indentation.\n"
        f"- Keep instructions concise, direct, professional, and easy to read.\n"
        f"- Recommend relevant Service Catalogue items or incident reporting when appropriate.\n"
        f"Safety rules: Never approve service requests or changes. Never fabricate ticket statuses.\n"
        f"Approved Knowledge Context:\n{kb_context}"
    )

    # 4. Generate Gemini response
    raw_response_text = await call_gemini_api(payload.message, system_instruction)
    response_text = clean_markdown_formatting(raw_response_text)

    # 5. Check if query looks like an incident report to provide structured draft metadata
    draft_meta = {}
    lower = payload.message.lower()
    if any(k in lower for k in ["restart", "broken", "flicker", "down", "error", "slow", "fail", "cannot access", "not working"]):
        category = "Hardware" if any(h in lower for h in ["laptop", "monitor", "dock", "screen", "keyboard"]) else "Network" if any(n in lower for n in ["wifi", "vpn", "internet", "dns"]) else "Software"
        draft_meta = {
            "suggested_incident": {
                "subject": payload.message[:60],
                "description": payload.message,
                "category": category,
                "impact": "medium",
                "urgency": "medium"
            }
        }

    # 6. Save Assistant response
    assistant_msg = AIMessage(
        conversation_id=conv_id,
        role="assistant",
        content=response_text,
        meta_info=draft_meta
    )
    session.add(assistant_msg)
    session.commit()
    session.refresh(assistant_msg)

    return {
        "conversation_id": str(conv_id),
        "message": {
            "id": str(assistant_msg.id),
            "role": assistant_msg.role,
            "content": assistant_msg.content,
            "metadata": assistant_msg.meta_info,
            "created_at": assistant_msg.created_at.isoformat()
        }
    }


@router.get("/conversations")
def list_conversations(
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    convs = session.exec(
        select(AIConversation)
        .where(AIConversation.user_id == current_user.id)
        .order_by(AIConversation.updated_at.desc())
    ).all()
    return convs


@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    conv = session.get(AIConversation, conversation_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = session.exec(
        select(AIMessage)
        .where(AIMessage.conversation_id == conversation_id)
        .order_by(AIMessage.created_at.asc())
    ).all()
    return messages


@router.post("/ticket-summary")
async def generate_ticket_summary(
    payload: TicketSummaryRequest,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Summarises incident details, observations, and suggests next steps for IT Support Agents.
    """
    incident = session.get(Incident, payload.incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    prompt = (
        f"Summarize this IT incident for support agents:\n"
        f"Ticket: {incident.ticket_number}\n"
        f"Subject: {incident.subject}\n"
        f"Description: {incident.description}\n"
        f"Category: {incident.category}\n"
        f"Priority: {incident.priority}\n"
        f"Status: {incident.status}\n"
        f"Resolution Notes: {incident.resolution_notes or 'None'}\n\n"
        f"Format with:\n"
        f"1. Executive Summary\n"
        f"2. Key Symptoms Observed\n"
        f"3. Attempted Workarounds\n"
        f"4. Recommended Next Actions"
    )

    summary = await call_gemini_api(prompt, "You are an expert ITSM Tier 3 Support Engineer.")
    return {
        "incident_id": str(incident.id),
        "ticket_number": incident.ticket_number,
        "summary": summary
    }


@router.post("/troubleshooting")
async def get_guided_troubleshooting(
    payload: TroubleshootingRequest,
    session: Session = Depends(get_session)
):
    prompt = f"Provide a concise, 4-step diagnostic and troubleshooting workflow for: {payload.query}. Category: {payload.category or 'General'}."
    steps = await call_gemini_api(prompt, "You are a senior IT Systems Diagnostic Assistant.")
    return {"query": payload.query, "steps": steps}
