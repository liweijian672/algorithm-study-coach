import math
from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime


@dataclass
class RecordWithProblem:
    problem_id: int
    status: str
    difficulty: str
    submitted_at: datetime
    tag_id: int = 1


DIFFICULTY_WEIGHT = {
    "easy": 0.8,
    "medium": 1.0,
    "hard": 1.3,
}


def _filter_superseded_failures(
    records: Sequence[RecordWithProblem],
) -> list[RecordWithProblem]:
    latest_accepted: dict[int, datetime] = {}
    for record in records:
        if record.status == "accepted":
            current = latest_accepted.get(record.problem_id)
            if current is None or record.submitted_at > current:
                latest_accepted[record.problem_id] = record.submitted_at

    filtered: list[RecordWithProblem] = []
    for record in records:
        if record.status != "accepted":
            accepted_at = latest_accepted.get(record.problem_id)
            if accepted_at is not None and record.submitted_at <= accepted_at:
                continue
        filtered.append(record)
    return filtered


def _record_weight(record: RecordWithProblem, now: datetime) -> float:
    difficulty_weight = DIFFICULTY_WEIGHT.get(record.difficulty, 1.0)
    days_since = max((now - record.submitted_at).total_seconds() / 86400, 0.0)
    time_weight = 0.5 + 0.5 * math.exp(-days_since / 30)
    return difficulty_weight * time_weight


def compute_tag_mastery(
    records: Sequence[RecordWithProblem],
    now: datetime,
) -> float:
    filtered = _filter_superseded_failures(records)
    weighted_accepted = 0.0
    weighted_failed = 0.0
    for record in filtered:
        weight = _record_weight(record, now)
        if record.status == "accepted":
            weighted_accepted += weight
        else:
            weighted_failed += weight * 0.5
    mastery = 100 * weighted_accepted / (weighted_accepted + weighted_failed + 0.5)
    return max(0.0, min(100.0, mastery))


def build_tag_mastery(
    records: Sequence[RecordWithProblem],
    now: datetime,
) -> dict[int, float]:
    by_tag: dict[int, list[RecordWithProblem]] = defaultdict(list)
    for record in records:
        by_tag[record.tag_id].append(record)
    return {
        tag_id: compute_tag_mastery(tag_records, now)
        for tag_id, tag_records in by_tag.items()
    }

