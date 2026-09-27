from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import Problem
from ..schemas import ProblemIn, ProblemOut

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/problems", response_model=ProblemOut)
def create_problem(payload: ProblemIn, db: Session = Depends(get_db)):
    existing = db.query(Problem).filter_by(source_id=payload.source_id).first()
    if existing:
        return existing
    problem = Problem(**payload.model_dump())
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return problem


@router.get("/problems/{problem_id}", response_model=ProblemOut)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    problem = db.get(Problem, problem_id)
    if problem is None:
        raise HTTPException(status_code=404, detail="problem not found")
    return problem

