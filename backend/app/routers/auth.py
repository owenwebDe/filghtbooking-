from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from datetime import timedelta
from ..models import UserCreate, UserLogin, UserResponse, Token, TokenData
from ..auth import create_access_token, get_current_user, verify_firebase_token
from ..mongodb_database import db_service
from ..firebase_client import firebase_client
from ..config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate):
    try:
        # Create user in Firebase Auth
        firebase_user = firebase_client.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.full_name
        )
        
        # Create user profile in Firestore
        user_profile = await db_service.create_user_profile(
            uid=firebase_user.uid,
            email=user_data.email,
            full_name=user_data.full_name,
            phone=user_data.phone
        )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_data.email, "uid": firebase_user.uid, "role": "user"},
            expires_delta=access_token_expires
        )
        
        return {
            "message": "User registered successfully",
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_profile
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=dict)
async def login(user_credentials: UserLogin):
    try:
        # Get user from Firebase
        firebase_user = firebase_client.get_user_by_email(user_credentials.email)
        if not firebase_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Get user profile from Firestore
        user_profile = await db_service.get_user_profile(firebase_user.uid)
        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user_credentials.email,
                "uid": firebase_user.uid,
                "role": user_profile.get("role", "user")
            },
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_profile
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/firebase-login", response_model=dict)
async def firebase_login(firebase_token: dict):
    try:
        # Verify Firebase ID token
        decoded_token = verify_firebase_token(firebase_token["idToken"])
        
        # Get or create user profile
        user_profile = await db_service.get_user_profile(decoded_token["uid"])
        if not user_profile:
            # Create profile for Firebase authenticated user
            firebase_user = firebase_client.get_user_by_uid(decoded_token["uid"])
            user_profile = await db_service.create_user_profile(
                uid=decoded_token["uid"],
                email=decoded_token["email"],
                full_name=firebase_user.display_name or "User",
                phone=firebase_user.phone_number
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": decoded_token["email"],
                "uid": decoded_token["uid"],
                "role": user_profile.get("role", "user")
            },
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_profile
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase authentication failed: {str(e)}"
        )

@router.get("/me", response_model=dict)
async def get_current_user_profile(current_user: TokenData = Depends(get_current_user)):
    user_profile = await db_service.get_user_profile(current_user.uid)
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    return {"user": user_profile}

@router.post("/logout", response_model=dict)
async def logout(current_user: TokenData = Depends(get_current_user)):
    # For JWT tokens, logout is handled client-side by removing the token
    # In a production environment, you might want to implement token blacklisting
    return {"message": "Logged out successfully"}