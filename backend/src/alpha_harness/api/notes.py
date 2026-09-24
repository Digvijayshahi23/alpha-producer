from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from ..db.models import ResearchNote
from ..schemas import Out
from .deps import State

router = APIRouter(prefix="/api/workbench", tags=["notes"])

class ResearchNoteCreate(BaseModel):
    title: str
    content: str
    linked_alpha_id: str | None = None

class ResearchNoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    linked_alpha_id: str | None = None

class ResearchNoteResponse(Out):
    id: str
    title: str
    content: str
    linked_alpha_id: str | None
    created_at: str
    updated_at: str

def _serialize(note: ResearchNote) -> dict[str, Any]:
    return {
        **{c.name: getattr(note, c.name) for c in note.__table__.columns},
        "created_at": note.created_at.isoformat(),
        "updated_at": note.updated_at.isoformat()
    }

@router.get("/notes", response_model=list[ResearchNoteResponse])
async def list_notes(state: State) -> Any:
    async with state.db.session() as session:
        result = await session.execute(
            select(ResearchNote).order_by(ResearchNote.updated_at.desc())
        )
        return [_serialize(n) for n in result.scalars().all()]

@router.post("/notes", response_model=ResearchNoteResponse)
async def create_note(data: ResearchNoteCreate, state: State) -> Any:
    note_id = str(uuid.uuid4())
    async with state.db.session() as session:
        new_note = ResearchNote(
            id=note_id,
            title=data.title,
            content=data.content,
            linked_alpha_id=data.linked_alpha_id
        )
        session.add(new_note)
        await session.commit()
        await session.refresh(new_note)
        return _serialize(new_note)

@router.put("/notes/{note_id}", response_model=ResearchNoteResponse)
async def update_note(note_id: str, data: ResearchNoteUpdate, state: State) -> Any:
    async with state.db.session() as session:
        note = await session.get(ResearchNote, note_id)
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(note, key, value)
        await session.commit()
        await session.refresh(note)
        return _serialize(note)

@router.delete("/notes/{note_id}")
async def delete_note(note_id: str, state: State) -> Any:
    async with state.db.session() as session:
        note = await session.get(ResearchNote, note_id)
        if note:
            await session.delete(note)
            await session.commit()
        return {"ok": True}
