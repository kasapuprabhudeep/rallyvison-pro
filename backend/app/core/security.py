import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from app.core.config import settings

def validate_password_strength(password: str) -> Optional[str]:
    """
    Validates password strength for everyday users:
    - Minimum 8 characters
    - Max 72 bytes (safe for bcrypt)
    - At least one letter (a-z, A-Z)
    - At least one digit or special symbol
    Returns None if valid, or an informative error string.
    """
    if not password or len(password) < 8:
        return "Password must be at least 8 characters long."
    if len(password.encode("utf-8")) > 72:
        return "Password must not exceed 72 bytes."
    if not any(c.isalpha() for c in password):
        return "Password must contain at least one letter."
    if not any(c.isdigit() or not c.isalnum() for c in password):
        return "Password must contain at least one digit or special symbol."
    return None

def get_password_hash(password: str) -> str:
    # Truncate to 72 bytes as required by bcrypt
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def create_access_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None

