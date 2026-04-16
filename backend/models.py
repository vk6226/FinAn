from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

# Helper to generate UUIDs as strings
def generate_uuid():
    return str(uuid.uuid4())

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str  # ADMIN, ANALYST, BANKER

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(default_factory=generate_uuid)
    password: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class UserPublic(UserBase):
    id: str
    createdAt: datetime

# Financial Report Models
class ReportBase(BaseModel):
    title: str
    companyA: str
    companyB: str
    dcfData: Dict[str, Any]
    maData: Dict[str, Any]

class ReportCreate(ReportBase):
    analystId: str

class ReportInDB(ReportBase):
    id: str = Field(default_factory=generate_uuid)
    analystId: str
    status: str = "PENDING"
    comments: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class ReportPublic(ReportInDB):
    pass

# Token Models for Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
