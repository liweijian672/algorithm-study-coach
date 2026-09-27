from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import Problem, ProblemTag, SolutionRecord, Tag
from ..schemas import DiagnosisOut, ProblemOut, TopicMasteryOut
from ..services.mastery import RecordWithProblem, build_tag_mastery
from ..services.recommendation import (
    ProblemWithTags,
    recommend_problems,
    recommend_problems_for_tag,
)
from ..services.taxonomy import ensure_default_tags

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@dataclass
class DiagnosisContext:
    tags: list[Tag]
    problems: dict[int, Problem]
    records: list[SolutionRecord]
    problem_tag_ids: dict[int, list[int]]
    records_with_problem: list[RecordWithProblem]
    mastery: dict[int, float]
    latest_status: dict[int, str | None]


def build_context(db: Session) -> DiagnosisContext:
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
    latest_status: dict[int, str | None] = {}
    for record in sorted(records, key=lambda item: item.submitted_at):
        latest_status[record.problem_id] = record.status

    return DiagnosisContext(
        tags=tags,
        problems=problems,
        records=records,
        problem_tag_ids=problem_tag_ids,
        records_with_problem=records_with_problem,
        mastery=mastery,
        latest_status=latest_status,
    )


def build_problem_views(context: DiagnosisContext) -> list[ProblemWithTags]:
    return [
        ProblemWithTags(
            id=problem.id,
            difficulty=problem.difficulty,
            tag_ids=context.problem_tag_ids.get(problem.id, []),
            last_status=context.latest_status.get(problem.id),
        )
        for problem in context.problems.values()
    ]


@router.get("/diagnosis", response_model=DiagnosisOut)
def get_diagnosis(db: Session = Depends(get_db)):
    context = build_context(db)
    practiced_tag_ids = {record.tag_id for record in context.records_with_problem}
    topics = []
    for tag in context.tags:
        topics.append(
            TopicMasteryOut(
                tag_id=tag.id,
                name=tag.name,
                display_name=tag.display_name,
                mastery=round(context.mastery.get(tag.id, 0.0), 2),
            ),
        )
    topics.sort(key=lambda item: item.mastery)

    weak_tags = [topic for topic in topics if topic.tag_id in practiced_tag_ids][:3]
    recommendations = recommend_problems(
        context.mastery,
        build_problem_views(context),
    )

    return DiagnosisOut(
        tag_mastery=topics,
        weak_tags=weak_tags,
        recommendations=recommendations,
    )


@router.get(
    "/topics/{tag_id}/recommendations",
    response_model=list[ProblemOut],
)
def get_topic_recommendations(
    tag_id: int,
    db: Session = Depends(get_db),
):
    context = build_context(db)
    recommended = recommend_problems_for_tag(
        context.mastery,
        build_problem_views(context),
        tag_id,
    )
    return [context.problems[problem_id] for problem_id in recommended]
