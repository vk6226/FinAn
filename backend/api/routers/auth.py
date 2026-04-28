from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List
from database import get_db
from models import UserCreate, UserInDB, UserPublic, Token, AuditLog
from api.utils import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from jose import JWTError, jwt
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = get_db()
    user = await db["users"].find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserPublic)
async def register(user_in: UserCreate):
    db = get_db()
    # Check if user exists
    existing_user = await db["users"].find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user_in.password)
    user_data = UserInDB(
        email=user_in.email,
        name=user_in.name,
        role=user_in.role,
        password=hashed_pwd
    ).dict(by_alias=True)
    
    await db["users"].insert_one(user_data)
    user_data["id"] = user_data["id"]
    return user_data

@router.post("/login", response_model=Token)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = await db["users"].find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        # Log failed attempt?
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create Audit Log
    log_entry = AuditLog(
        email=user["email"],
        action="LOGIN",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    ).dict()
    await db["audit_logs"].insert_one(log_entry)

    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserPublic)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {**current_user, "id": current_user["id"]}
