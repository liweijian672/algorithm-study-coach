from datetime import datetime

import pytest

from app.services.mastery import RecordWithProblem, compute_tag_mastery


def test_single_easy_acceptance():
    records = [
        RecordWithProblem(
            problem_id=1,
            status="accepted",
            difficulty="easy",
            submitted_at=datetime(2026, 9, 27),
        ),
    ]
    assert compute_tag_mastery(records, datetime(2026, 9, 27)) == pytest.approx(
        61.538, abs=0.001
    )


def test_later_acceptance_suppresses_earlier_failure():
    records = [
        RecordWithProblem(
            problem_id=1,
            status="wrong",
            difficulty="easy",
            submitted_at=datetime(2026, 9, 27, 9),
        ),
        RecordWithProblem(
            problem_id=1,
            status="accepted",
            difficulty="easy",
            submitted_at=datetime(2026, 9, 27, 10),
        ),
    ]
    assert compute_tag_mastery(records, datetime(2026, 9, 27)) == pytest.approx(
        61.538, abs=0.001
    )

