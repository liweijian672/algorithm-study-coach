from collections.abc import Sequence
from dataclasses import dataclass


@dataclass
class ProblemWithTags:
    id: int
    difficulty: str
    tag_ids: list[int]
    last_status: str | None = None


DIFFICULTY_ORDER = {"easy": 0, "medium": 1, "hard": 2}


def recommend_problems(
    mastery: dict[int, float],
    problems: Sequence[ProblemWithTags],
) -> list[int]:
    candidates = [problem for problem in problems if problem.last_status != "accepted"]
    ranked: list[tuple[float, int, int]] = []
    for problem in candidates:
        weakest = min((mastery.get(tag_id, 100.0) for tag_id in problem.tag_ids), default=100.0)
        difficulty_order = DIFFICULTY_ORDER.get(problem.difficulty, 1)
        recently_failed = 1 if problem.last_status in {"wrong", "time_limit", "runtime_error"} else 0
        ranked.append((weakest, difficulty_order, recently_failed, problem.id))
    ranked.sort(key=lambda item: (item[0], item[1], item[2], item[3]))
    return [item[3] for item in ranked]


def recommend_problems_for_tag(
    mastery: dict[int, float],
    problems: Sequence[ProblemWithTags],
    tag_id: int,
) -> list[int]:
    tagged = [problem for problem in problems if tag_id in problem.tag_ids]
    return recommend_problems(mastery, tagged)
