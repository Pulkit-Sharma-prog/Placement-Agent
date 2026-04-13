"""
Agent 6: Recommendation & Notification Agent

Sends email/in-app notifications for match alerts, daily digests,
shortlist events, and interview reminders.
"""

import os
import smtplib
import sys
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.base_agent import BaseAgent

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASSWORD", "")


class RecommendationAgent(BaseAgent):
    name = "RecommendationAgent"

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        event_type = input_data.get("event_type", "match_alert")
        user_id = input_data.get("user_id")
        data = input_data.get("data", {})

        self.log(f"Processing notification: {event_type} for user {user_id}")

        handlers = {
            "match_alert":   self._handle_match_alert,
            "shortlist":     self._handle_shortlist,
            "interview_reminder": self._handle_interview_reminder,
            "daily_digest":  self._handle_daily_digest,
        }

        handler = handlers.get(event_type, self._handle_generic)
        return await handler(user_id, data)

    async def _handle_match_alert(self, user_id: str, data: dict) -> dict:
        title = f"New Job Match: {data.get('company', '')} — {data.get('job_title', '')}"
        body = (
            f"You have a {data.get('score', 0):.0f}% match with "
            f"{data.get('job_title', '')} at {data.get('company', '')}!\n"
            f"Skill overlap: {', '.join(data.get('skill_overlap', []))}"
        )
        return await self._create_notification(user_id, "match_alert", title, body)

    async def _handle_shortlist(self, user_id: str, data: dict) -> dict:
        title = f"Shortlisted at {data.get('company', '')}!"
        body = (
            f"Congratulations! You've been shortlisted for {data.get('job_title', '')} "
            f"at {data.get('company', '')}. Next steps: {data.get('next_steps', 'Check your email.')}"
        )
        return await self._create_notification(user_id, "shortlist", title, body)

    async def _handle_interview_reminder(self, user_id: str, data: dict) -> dict:
        title = f"Interview Tomorrow — {data.get('company', '')}"
        body = (
            f"Your interview at {data.get('company', '')} is tomorrow at "
            f"{data.get('interview_time', 'TBD')}. "
            f"Meeting link: {data.get('meeting_link', 'Check your email.')}"
        )
        return await self._create_notification(user_id, "reminder", title, body)

    async def _handle_daily_digest(self, user_id: str, data: dict) -> dict:
        matches = data.get("top_matches", [])
        title = "Your Daily Job Matches Digest"
        body = "Top matches for you today:\n" + "\n".join(
            f"  {i+1}. {m.get('job_title')} at {m.get('company')} — {m.get('score', 0):.0f}% match"
            for i, m in enumerate(matches[:3])
        )
        return await self._create_notification(user_id, "digest", title, body)

    async def _handle_generic(self, user_id: str, data: dict) -> dict:
        return await self._create_notification(user_id, "info", data.get("title", "Update"), data.get("body", ""))

    async def _create_notification(self, user_id: str, ntype: str, title: str, body: str) -> dict:
        from database.connection import get_db
        from database.models import Notification, User

        with get_db() as db:
            user = db.query(User).filter_by(id=user_id).first()
            if not user:
                return {"success": False, "error": "User not found"}

            notif = Notification(
                user_id=user_id,
                type=ntype,
                title=title,
                body=body,
                sent_via="in_app",
                delivery_status="sent",
            )
            db.add(notif)
            db.flush()
            notif_id = notif.id

        # Try email delivery (non-blocking, silently fail)
        email_sent = False
        if SMTP_USER and user and user.email:
            try:
                self._send_email(user.email, title, body)
                email_sent = True
            except Exception as e:
                self.log(f"Email delivery failed: {e}", "WARNING")

        return {
            "success": True,
            "notification_id": notif_id,
            "in_app": True,
            "email_sent": email_sent,
        }

    def _send_email(self, to: str, subject: str, body: str):
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_USER
        msg["To"] = to
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to, msg.as_string())
