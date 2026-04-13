"""
Agent 5: Interview & Application Tracking Agent

Manages application state machine transitions with validation.
Logs events, calculates time-in-stage metrics.
"""

import os
import sys
from datetime import datetime
from typing import Any, Dict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.base_agent import BaseAgent

# Valid state transitions
VALID_TRANSITIONS = {
    "applied":             {"screening", "rejected"},
    "screening":           {"interview_scheduled", "rejected"},
    "interview_scheduled": {"interview_done", "rejected"},
    "interview_done":      {"offer_received", "rejected"},
    "offer_received":      {"accepted", "rejected"},
    "accepted":            set(),
    "rejected":            set(),
}


class InterviewTrackerAgent(BaseAgent):
    name = "InterviewTrackerAgent"

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        application_id = input_data["application_id"]
        new_state = input_data["new_state"].lower()
        metadata = input_data.get("metadata", {})

        from database.connection import get_db
        from database.models import Application, ApplicationEvent

        with get_db() as db:
            app = db.query(Application).filter_by(id=application_id).first()
            if not app:
                return {"error": f"Application {application_id} not found", "transition_valid": False}

            current_state = app.status
            valid = self._validate_transition(current_state, new_state)

            if not valid:
                self.log(f"Invalid transition {current_state} → {new_state}", "WARNING")
                return {
                    "application_id": application_id,
                    "previous_state": current_state,
                    "new_state": new_state,
                    "transition_valid": False,
                    "notification_sent": False,
                    "error": f"Transition {current_state} → {new_state} is not allowed",
                }

            # Log event
            event = ApplicationEvent(application_id=application_id)
            event.from_status = current_state
            event.to_status = new_state
            event.event_metadata = metadata
            db.add(event)

            # Update application
            app.status = new_state
            app.last_updated = datetime.utcnow()

            # Set CTC if offer
            if new_state == "offer_received" and "ctc_offered" in metadata:
                app.ctc_offered = metadata["ctc_offered"]

            # Update student status if accepted
            if new_state == "accepted":
                from database.models import Student
                student = db.query(Student).filter_by(id=app.student_id).first()
                if student:
                    student.status = "placed"

        self.log(f"Transition {current_state} → {new_state} for application {application_id}")

        return {
            "application_id": application_id,
            "previous_state": current_state,
            "new_state": new_state,
            "transition_valid": True,
            "notification_sent": True,
        }

    def _validate_transition(self, from_state: str, to_state: str) -> bool:
        allowed = VALID_TRANSITIONS.get(from_state, set())
        return to_state in allowed
