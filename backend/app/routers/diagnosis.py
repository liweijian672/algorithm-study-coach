from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import Problem, ProblemTag, SolutionRecord, Tag
from ..schemas import DiagnosisOut, TopicMasteryOut
from ..services.mastery import RecordWithProblem, build_tag_mastery
from ..services.recommendation import ProblemWithTags, recommend_problems
from ..services.taxonomy import DEFAULT_TAGS

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_default_tags(db: Session) -> list[Tag]:
    existing = {tag.name: tag for tag in db.query(Tag).all()}
    for name, display_name in DEFAULT_TAGS:
        if name not in existing:
            tag = Tag(name=name, display_name=display_name)
            db.add(tag)
            existing[name] = tag
    db.commit()
    return list(existing.values())


@router.get("/diagnosis", response_model=DiagnosisOut)
def get_diagnosis(db: Session = Depends(get_db)):
    tags = ensure_default_tags(db)
    problems = {problem.id: problem for problem in db.query(Problem).all()}
    records = db.query(SolutionRecord).all()

    problem_tag_ids: dict[int, list[int]] = defaultdict(list)
    for problem_tag in db.query(ProblemTag).all():
        problem_tag_ids[problem_tag.problem_id].append(problem_tag.tag_id)

    records_with_problem: list[RecordWithProblem] = []
    for record in records:
        problem = problems.get(record.problem_id)
        if problem is None:
            continue
        for tag_id in problem_tag_ids.get(record.problem_id, []):
            records_with_problem.append(
                RecordWithProblem(
                    problem_id=record.problem_id,
                    status=record.status,
                    difficulty=problem.difficulty,
                    submitted_at=record.submitted_at,
                    tag_id=tag_id,
                ),
            )

    mastery = build_tag_mastery(records_with_problem, datetime.utcnow())
    practiced_tag_ids = {record.tag_id for record in records_with_problem}
    topics = []
    for tag in tags:
        topics.append(
            TopicMasteryOut(
                tag_id=tag.id,
                name=tag.name,
                display_name=tag.display_name,
                mastery=round(mastery.get(tag.id, 0.0), 2),
            ),
        )
    topics.sort(key=lambda item: item.mastery)

    weak_tags = [topic for topic in topics if topic.tag_id in practiced_tag_ids][:3]

    latest_status: dict[int, str | None] = {}
    for record in sorted(records, key=lambda item: item.submitted_at):
        latest_status[record.problem_id] = record.status

    problem_views = [
        ProblemWithTags(
            id=problem.id,
            difficulty=problem.difficulty,
            tag_ids=problem_tag_ids.get(problem.id, []),
            last_status=latest_status.get(problem.id),
        )
        for problem in problems.values()
    ]
    recommendations = recommend_problems(mastery, problem_views)

    return DiagnosisOut(
        tag_mastery=topics,
        weak_tags=weak_tags,
        recommendations=recommendations,
    )

