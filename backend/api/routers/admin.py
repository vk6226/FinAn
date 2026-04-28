from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database import get_db
from models import AuditLog
from api.routers.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

async def check_admin_role(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role"
        )
    return current_user

@router.get("/logs", response_model=List[dict])
async def get_audit_logs(
    limit: int = 50, 
    skip: int = 0, 
    admin_user: dict = Depends(check_admin_role)
):
    db = get_db()
    logs = await db["audit_logs"].find().sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    return logs
