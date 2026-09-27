from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import Problem
from ..schemas import CoachOut
from ..services.coaching import (
    generate_explanation,
    generate_hints,
    generate_solutions,
)
from ..services.llm_client import OpenAICompatibleLLMClient

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/problems/{problem_id}/coach", response_model=CoachOut)
def get_coach(problem_id: int, db: Session = Depends(get_db)):
    problem = db.get(Problem, problem_id)
    if problem is None:
        raise HTTPException(status_code=404, detail="problem not found")
    client = OpenAICompatibleLLMClient()
    return CoachOut(
        explanation=generate_explanation(problem, client),
        hints=generate_hints(problem, client),
        solutions=generate_solutions(problem, client),
    )

