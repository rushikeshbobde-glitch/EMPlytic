from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, AuditLog, EmployeeRecord
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    normalize_role
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

def init_demo_users(db: Session):
    """Seed initial demo accounts if not already present."""
    demo_accounts = [
        {
            "name": "HR Administrator",
            "email": "admin@emplytic.com",
            "password": "admin123",
            "role": "HR_ADMIN",
            "employee_id": "ADMIN-01"
        },
        {
            "name": "Sarah Jenkins",
            "email": "employee@emplytic.com",
            "password": "emp123",
            "role": "EMPLOYEE",
            "employee_id": "1"
        }
    ]
    for acc in demo_accounts:
        existing = db.query(User).filter(User.email == acc["email"]).first()
        if not existing:
            new_user = User(
                name=acc["name"],
                email=acc["email"],
                password_hash=hash_password(acc["password"]),
                role=acc["role"],
                employee_id=acc["employee_id"]
            )
            db.add(new_user)
    db.commit()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    role = normalize_role(data.role)

    email_clean = data.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        name=data.name.strip(),
        email=email_clean,
        password_hash=hash_password(data.password),
        role=role,
        employee_id=data.employee_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log
    db.add(AuditLog(user_id=user.id, action="USER_REGISTERED", details=f"Registered as {role}"))
    db.commit()

    token = create_access_token({
        "sub": user.email,
        "role": user.role,
        "name": user.name,
        "id": user.id,
        "employee_id": user.employee_id
    })

    return {
        "success": True,
        "message": "Registration successful",
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "employee_id": user.employee_id
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Initialize demo users if table is empty
    if db.query(User).count() == 0:
        init_demo_users(db)

    identifier = data.email.strip()
    # Match against email or employee_id
    user = db.query(User).filter(
        (User.email.ilike(identifier)) | (User.employee_id == identifier)
    ).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token({
        "sub": user.email,
        "role": user.role,
        "name": user.name,
        "id": user.id,
        "employee_id": user.employee_id
    })

    # Record login audit
    db.add(AuditLog(user_id=user.id, action="LOGIN", details=f"Successful login for {user.email}"))
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "user": UserResponse.model_validate(user)
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "employee_id": current_user.employee_id,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        }
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(AuditLog(user_id=current_user.id, action="LOGOUT", details=f"User {current_user.email} logged out"))
    db.commit()
    return {
        "success": True,
        "message": "Logged out successfully"
    }
