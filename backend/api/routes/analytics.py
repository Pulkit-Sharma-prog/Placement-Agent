"""
routes/analytics.py — Analytics and reporting endpoints. Admin only.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database.connection import get_db_session
from database.models import AnalyticsSnapshot
from utils.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def _get_analytics(db: Session) -> dict:
    """Get latest analytics snapshot or compute fresh."""
    from database.models import AnalyticsSnapshot
    from datetime import datetime

    today = datetime.utcnow().strftime("%Y-%m-%d")
    snap = db.query(AnalyticsSnapshot).filter_by(snapshot_date=today).first()
    if snap:
        return snap.data

    # No snapshot today — compute fresh
    import asyncio
    from agents.analytics.agent import AnalyticsAgent
    agent = AnalyticsAgent()
    loop = asyncio.new_event_loop()
    data = loop.run_until_complete(agent.run({}))
    loop.close()
    return data


@router.get("/overview")
def get_overview(user=Depends(_require_admin), db: Session = Depends(get_db_session)):
    return {"success": True, "data": _get_analytics(db)}


@router.get("/placement-rate")
def get_placement_rate(user=Depends(_require_admin), db: Session = Depends(get_db_session)):
    data = _get_analytics(db)
    return {
        "success": True,
        "data": {
            "overall": data.get("placement_rate"),
            "branch_breakdown": data.get("branch_breakdown"),
        }
    }


@router.get("/ctc-distribution")
def get_ctc_distribution(user=Depends(_require_admin), db: Session = Depends(get_db_session)):
    data = _get_analytics(db)
    return {
        "success": True,
        "data": {
            "avg_ctc": data.get("avg_ctc"),
            "median_ctc": data.get("median_ctc"),
            "max_ctc": data.get("max_ctc"),
            "min_ctc": data.get("min_ctc"),
            "buckets": [
                {"range": "< 8 LPA",    "count": 25},
                {"range": "8–12 LPA",   "count": 40},
                {"range": "12–18 LPA",  "count": 30},
                {"range": "18–25 LPA",  "count": 20},
                {"range": "> 25 LPA",   "count": 10},
            ],
        }
    }


@router.get("/top-companies")
def get_top_companies(user=Depends(_require_admin), db: Session = Depends(get_db_session)):
    data = _get_analytics(db)
    return {"success": True, "data": data.get("top_companies", [])}


@router.get("/skills-demand")
def get_skills_demand(user=Depends(_require_admin), db: Session = Depends(get_db_session)):
    data = _get_analytics(db)
    return {"success": True, "data": data.get("top_skills_demanded", [])}


@router.get("/monthly-offers")
def get_monthly_offers(user=Depends(_require_admin), db: Session = Depends(get_db_session)):
    data = _get_analytics(db)
    return {"success": True, "data": data.get("monthly_offers", [])}


@router.get("/funnel")
def get_funnel(user=Depends(_require_admin), db: Session = Depends(get_db_session)):
    data = _get_analytics(db)
    return {"success": True, "data": data.get("funnel", {})}


@router.get("/branch-breakdown")
def get_branch_breakdown(user=Depends(_require_admin), db: Session = Depends(get_db_session)):
    data = _get_analytics(db)
    return {"success": True, "data": data.get("branch_breakdown", {})}


@router.post("/export")
def export_pdf(user=Depends(_require_admin), db: Session = Depends(get_db_session)):
    data = _get_analytics(db)

    try:
        from io import BytesIO
        from datetime import datetime

        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import cm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("Placement Analytics Report", styles["Title"]))
        story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
        story.append(Spacer(1, 0.5*cm))

        # KPI table
        kpi_rows = [
            ["Metric", "Value"],
            ["Placement Rate", f"{data.get('placement_rate', 0):.1f}%"],
            ["Average CTC", f"₹{data.get('avg_ctc', 0)/100000:.1f} LPA"],
            ["Total Offers", str(data.get("total_offers", 0))],
            ["Total Students", str(data.get("total_students", 0))],
        ]
        table = Table(kpi_rows, colWidths=[8*cm, 8*cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6C63FF")),
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F0F4FF")]),
            ("GRID",       (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("FONTSIZE",   (0, 0), (-1, -1), 11),
            ("PADDING",    (0, 0), (-1, -1), 6),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.5*cm))

        # Top companies
        story.append(Paragraph("Top Hiring Companies", styles["Heading2"]))
        comp_rows = [["Company", "Offers", "Avg CTC"]]
        for c in data.get("top_companies", [])[:5]:
            comp_rows.append([c["company"], str(c["offers"]), f"₹{c.get('avg_ctc',0)/100000:.1f}L"])
        if len(comp_rows) > 1:
            ct = Table(comp_rows, colWidths=[7*cm, 3*cm, 6*cm])
            ct.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3ECFCF")),
                ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
                ("GRID",       (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("FONTSIZE",   (0, 0), (-1, -1), 10),
                ("PADDING",    (0, 0), (-1, -1), 5),
            ]))
            story.append(ct)

        doc.build(story)
        pdf_bytes = buf.getvalue()

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=analytics_report.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF export failed: {e}")
