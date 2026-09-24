from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from ..db.models import Experiment
from ..schemas import Out
from .deps import State

router = APIRouter(prefix="/api/workbench", tags=["experiments"])

class ExperimentCreate(BaseModel):
    name: str
    hypothesis: str | None = None
    base_alpha_id: str | None = None
    parameters: dict[str, Any] = {}
    status: str = "Planned"

class ExperimentUpdate(BaseModel):
    name: str | None = None
    hypothesis: str | None = None
    base_alpha_id: str | None = None
    parameters: dict[str, Any] | None = None
    results: dict[str, Any] | None = None
    status: str | None = None

class ExperimentResponse(Out):
    id: str
    name: str
    hypothesis: str | None
    base_alpha_id: str | None
    parameters: dict[str, Any]
    results: dict[str, Any]
    status: str
    created_at: str
    updated_at: str

def _serialize(exp: Experiment) -> dict[str, Any]:
    return {
        **{c.name: getattr(exp, c.name) for c in exp.__table__.columns},
        "created_at": exp.created_at.isoformat(),
        "updated_at": exp.updated_at.isoformat()
    }

@router.get("/experiments", response_model=list[ExperimentResponse])
async def list_experiments(state: State) -> Any:
    async with state.db.session() as session:
        result = await session.execute(select(Experiment).order_by(Experiment.updated_at.desc()))
        return [_serialize(e) for e in result.scalars().all()]

@router.post("/experiments", response_model=ExperimentResponse)
async def create_experiment(data: ExperimentCreate, state: State) -> Any:
    exp_id = str(uuid.uuid4())
    async with state.db.session() as session:
        new_exp = Experiment(
            id=exp_id,
            name=data.name,
            hypothesis=data.hypothesis,
            base_alpha_id=data.base_alpha_id,
            parameters=data.parameters,
            status=data.status
        )
        session.add(new_exp)
        await session.commit()
        await session.refresh(new_exp)
        return _serialize(new_exp)

@router.put("/experiments/{exp_id}", response_model=ExperimentResponse)
async def update_experiment(exp_id: str, data: ExperimentUpdate, state: State) -> Any:
    async with state.db.session() as session:
        exp = await session.get(Experiment, exp_id)
        if not exp:
            raise HTTPException(status_code=404, detail="Experiment not found")
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(exp, key, value)
        await session.commit()
        await session.refresh(exp)
        return _serialize(exp)

@router.delete("/experiments/{exp_id}")
async def delete_experiment(exp_id: str, state: State) -> Any:
    async with state.db.session() as session:
        exp = await session.get(Experiment, exp_id)
        if exp:
            await session.delete(exp)
            await session.commit()
        return {"ok": True}
