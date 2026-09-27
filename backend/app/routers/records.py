from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import SolutionRecord
from ..schemas import RecordIn, RecordOut

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/records", response_model=RecordOut)
def create_record(payload: RecordIn, db: Session = Depends(get_db)):
    existing = db.query(SolutionRecord).filter_by(event_key=payload.event_key).first()
    if existing:
        return existing
    record = SolutionRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/records", response_model=list[RecordOut])
def list_records(problem_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(SolutionRecord)
    if problem_id is not None:
        query = query.filter_by(problem_id=problem_id)
    return query.all()

