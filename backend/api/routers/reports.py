from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List
from database import get_db
from models import ReportCreate, ReportPublic, ReportInDB
from api.routers.auth import get_current_user
from engine.math_engine import FinancialEngine
from engine.report_engine import ReportEngine
from datetime import datetime
import uuid

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/", response_model=ReportPublic)
async def create_report(report_in: ReportCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ANALYST":
        raise HTTPException(status_code=403, detail="Only analysts can create reports")
    
    # 1. Calculation
    dcf_results = FinancialEngine.calculate_dcf(report_in.dcfData)
    ma_results = FinancialEngine.calculate_ma(report_in.maData, dcf_results)
    
    # 2. Prepare DB record
    report_db = ReportInDB(
        title=report_in.title,
        companyA=report_in.companyA,
        companyB=report_in.companyB,
        analystId=current_user["id"],
        dcfData=dcf_results,
        maData=ma_results
    ).dict(by_alias=True)
    
    db = get_db()
    await db["reports"].insert_one(report_db)
    return report_db

@router.get("/", response_model=List[ReportPublic])
async def list_reports(current_user: dict = Depends(get_current_user)):
    db = get_db()
    query = {}
    if current_user["role"] == "ANALYST":
        query = {"analystId": current_user["id"]}
    
    cursor = db["reports"].find(query).sort("createdAt", -1)
    reports = await cursor.to_list(length=100)
    return reports

@router.get("/{report_id}", response_model=ReportPublic)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    report = await db["reports"].find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/{report_id}/pdf")
async def get_report_pdf(report_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    report = await db["reports"].find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Get analyst name
    analyst = await db["users"].find_one({"id": report["analystId"]})
    analyst_name = analyst["name"] if analyst else "Unknown Analyst"
    
    # Generate PDF
    pdf_content = ReportEngine.generate_pdf(report, report["dcfData"], report["maData"], analyst_name)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Report_{report_id}.pdf"}
    )

@router.patch("/{report_id}", response_model=ReportPublic)
async def update_report_status(report_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "BANKER":
        raise HTTPException(status_code=403, detail="Only bankers can review reports")
    
    db = get_db()
    update_dict = {
        "status": update_data.get("status"),
        "comments": update_data.get("comments"),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db["reports"].update_one({"id": report_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
        
    updated_report = await db["reports"].find_one({"id": report_id})
    return updated_report
