import json
from dataclasses import dataclass

from ..models import Problem, Tag
from .llm_client import LLMClient


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
        "Return JSON with a single key tags, an array of algorithm tags. "
        f"Title: {problem.title}. Difficulty: {problem.difficulty}."
    )
    raw = client.complete(prompt)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return []

    names = payload.get("tags", []) if isinstance(payload, dict) else []
    known = {tag.name: tag for tag in taxonomy}
    assignments = []
    for name in names:
        tag = known.get(name)
        if tag:
            assignments.append(TagAssignment(tag_id=tag.id, confidence=1.0))
    return assignments

