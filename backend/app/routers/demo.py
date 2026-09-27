from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..demo_data import DEMO_PROBLEMS
from ..models import Problem, ProblemTag, SolutionRecord
from ..services.taxonomy import ensure_default_tags

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/demo/import")
def import_demo(db: Session = Depends(get_db)):
    tags = ensure_default_tags(db)
    tag_by_name = {tag.name: tag for tag in tags}
    imported = 0

    for item in DEMO_PROBLEMS:
        problem = db.query(Problem).filter_by(source_id=item["source_id"]).first()
        if problem is None:
            problem = Problem(
                platform="niuke",
                source_id=item["source_id"],
                title=item["title"],
                difficulty=item["difficulty"],
                url=item["url"],
                description=None,
            )
            db.add(problem)
            db.commit()
            db.refresh(problem)
            imported += 1

        for tag_name in item["tags"]:
            tag = tag_by_name[tag_name]
            exists = (
                db.query(ProblemTag)
                .filter_by(problem_id=problem.id, tag_id=tag.id)
                .first()
            )
            if exists is None:
                db.add(
                    ProblemTag(
                        problem_id=problem.id,
                        tag_id=tag.id,
                        confidence=1.0,
                    ),
                )

        for index, record in enumerate(item["records"]):
            event_key = f"demo:{item['source_id']}:{index}"
            existing_record = (
                db.query(SolutionRecord).filter_by(event_key=event_key).first()
            )
            if existing_record is None:
                db.add(
                    SolutionRecord(
                        problem_id=problem.id,
                        status=record["status"],
                        language="cpp",
                        code="// demo submission",
                        time_cost_ms=None,
                        memory_cost_kb=None,
                        submitted_at=datetime.utcnow()
                        - timedelta(days=record["days_ago"]),
                        event_key=event_key,
                    ),
                )

    db.commit()
    return {"imported": imported}

