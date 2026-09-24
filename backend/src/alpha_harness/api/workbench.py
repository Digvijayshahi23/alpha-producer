from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from ..db.models import LocalAlpha
from ..schemas import Out
from .deps import State

router = APIRouter(prefix="/api/workbench", tags=["workbench"])

class LocalAlphaCreate(BaseModel):
    name: str | None = None
    expression: str
    description: str | None = None
    idea: str | None = None
    data_rationale: str | None = None
    operator_rationale: str | None = None
    region: str | None = None
    universe: str | None = None
    dataset: str | None = None
    tags: list[str] = []
    status: str = "Draft"

class LocalAlphaUpdate(BaseModel):
    name: str | None = None
    expression: str | None = None
    description: str | None = None
    idea: str | None = None
    data_rationale: str | None = None
    operator_rationale: str | None = None
    region: str | None = None
    universe: str | None = None
    dataset: str | None = None
    tags: list[str] | None = None
    status: str | None = None

class LocalAlphaResponse(Out):
    id: str
    name: str | None
    expression: str
    description: str | None
    idea: str | None
    data_rationale: str | None
    operator_rationale: str | None
    region: str | None
    universe: str | None
    dataset: str | None
    tags: list[str]
    status: str
    created_at: str
    updated_at: str

def _serialize(alpha: LocalAlpha) -> dict[str, Any]:
    return {
        **{c.name: getattr(alpha, c.name) for c in alpha.__table__.columns},
        "created_at": alpha.created_at.isoformat(),
        "updated_at": alpha.updated_at.isoformat()
    }

@router.get("/alphas", response_model=list[LocalAlphaResponse])
async def list_alphas(state: State) -> Any:
    async with state.db.session() as session:
        result = await session.execute(select(LocalAlpha).order_by(LocalAlpha.updated_at.desc()))
        alphas = result.scalars().all()
        return [_serialize(a) for a in alphas]

@router.post("/alphas", response_model=LocalAlphaResponse)
async def create_alpha(data: LocalAlphaCreate, state: State) -> Any:
    alpha_id = str(uuid.uuid4())
    async with state.db.session() as session:
        new_alpha = LocalAlpha(
            id=alpha_id,
            name=data.name,
            expression=data.expression,
            description=data.description,
            idea=data.idea,
            data_rationale=data.data_rationale,
            operator_rationale=data.operator_rationale,
            region=data.region,
            universe=data.universe,
            dataset=data.dataset,
            tags=data.tags,
            status=data.status,
        )
        session.add(new_alpha)
        await session.commit()
        await session.refresh(new_alpha)
        return _serialize(new_alpha)

@router.put("/alphas/{alpha_id}", response_model=LocalAlphaResponse)
async def update_alpha(alpha_id: str, data: LocalAlphaUpdate, state: State) -> Any:
    async with state.db.session() as session:
        alpha = await session.get(LocalAlpha, alpha_id)
        if not alpha:
            raise HTTPException(status_code=404, detail="Alpha not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(alpha, key, value)

        await session.commit()
        await session.refresh(alpha)
        return _serialize(alpha)

@router.delete("/alphas/{alpha_id}")
async def delete_alpha(alpha_id: str, state: State) -> Any:
    async with state.db.session() as session:
        alpha = await session.get(LocalAlpha, alpha_id)
        if alpha:
            await session.delete(alpha)
            await session.commit()
        return {"ok": True}
