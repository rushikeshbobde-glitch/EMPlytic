from typing import Optional
from pydantic import BaseModel

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "HR_USER"
    employee_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: str  # Can be email address or employee_id
    password: str
    remember: Optional[bool] = False

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    employee_id: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user: Optional[UserResponse] = None
