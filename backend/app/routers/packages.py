from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from ..models import VacationPackageCreate, VacationPackageUpdate, VacationPackageResponse
from ..auth import get_current_user, require_admin
from ..mongodb_database import db_service

router = APIRouter(prefix="/packages", tags=["vacation-packages"])

@router.get("/search", response_model=List[VacationPackageResponse])
async def search_packages(
    destination: Optional[str] = Query(None),
    limit: Optional[int] = Query(50)
):
    filters = {}
    if destination:
        filters["destination"] = destination
    
    packages = await db_service.get_vacation_packages(filters=filters, limit=limit)
    return packages

@router.get("/", response_model=List[VacationPackageResponse])
async def get_all_packages(limit: Optional[int] = Query(50)):
    packages = await db_service.get_vacation_packages(limit=limit)
    return packages

@router.get("/{package_id}", response_model=VacationPackageResponse)
async def get_package(package_id: str):
    package = await db_service.get_vacation_package(package_id)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation package not found"
        )
    return package

@router.post("/", response_model=dict)
async def create_package(
    package_data: VacationPackageCreate,
    current_user = Depends(require_admin)
):
    try:
        package_id = await db_service.create_vacation_package(package_data.dict())
        package = await db_service.get_vacation_package(package_id)
        return {"message": "Vacation package created successfully", "package": package}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create vacation package: {str(e)}"
        )

@router.put("/{package_id}", response_model=dict)
async def update_package(
    package_id: str,
    package_data: VacationPackageUpdate,
    current_user = Depends(require_admin)
):
    existing_package = await db_service.get_vacation_package(package_id)
    if not existing_package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation package not found"
        )
    
    try:
        update_data = {k: v for k, v in package_data.dict().items() if v is not None}
        updated_package = await db_service.update_vacation_package(package_id, update_data)
        return {"message": "Vacation package updated successfully", "package": updated_package}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update vacation package: {str(e)}"
        )

@router.delete("/{package_id}", response_model=dict)
async def delete_package(
    package_id: str,
    current_user = Depends(require_admin)
):
    existing_package = await db_service.get_vacation_package(package_id)
    if not existing_package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation package not found"
        )
    
    try:
        await db_service.delete_vacation_package(package_id)
        return {"message": "Vacation package deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete vacation package: {str(e)}"
        )