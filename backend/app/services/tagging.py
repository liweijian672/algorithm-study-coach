import json
from dataclasses import dataclass

from sqlalchemy.orm import Session

from ..models import Problem, ProblemTag, Tag
from .llm_client import LLMClient
from .taxonomy import ensure_default_tags


@dataclass
class TagAssignment:
    tag_id: int
    confidence: float


def assign_tags(
    problem: Problem,
    taxonomy: list[Tag],
    client: LLMClient,
) -> list[TagAssignment]:
    prompt = (
        "Return JSON with a single key tags, an array of algorithm tags "
        "chosen only from this list: "
        + ", ".join(tag.name for tag in taxonomy)
        + f". Title: {problem.title}. Difficulty: {problem.difficulty}."
    )
    raw = client.complete(prompt)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return []

    names = payload.get("tags", []) if isinstance(payload, dict) else []
    known = {tag.name: tag for tag in taxonomy}
    known.update({tag.display_name: tag for tag in taxonomy})
    assignments = []
    for name in names:
        tag = known.get(name) or known.get(str(name).strip())
        if tag:
            assignments.append(TagAssignment(tag_id=tag.id, confidence=1.0))
    return assignments


def tag_and_store_problem(
    problem: Problem,
    db: Session,
    client: LLMClient,
) -> int:
    tags = ensure_default_tags(db)
    assignments = assign_tags(problem, tags, client)
    existing = {
        (link.problem_id, link.tag_id)
        for link in db.query(ProblemTag).filter_by(problem_id=problem.id).all()
    }
    added = 0
    for assignment in assignments:
        key = (problem.id, assignment.tag_id)
        if key in existing:
            continue
        db.add(
            ProblemTag(
                problem_id=problem.id,
                tag_id=assignment.tag_id,
                confidence=assignment.confidence,
            ),
        )
        existing.add(key)
        added += 1
    if added:
        db.commit()
    return added

