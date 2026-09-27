from app.services.recommendation import ProblemWithTags, recommend_problems


def test_recommends_unsolved_problem_from_weak_tag():
    mastery = {1: 20.0, 2: 90.0}
    problems = [
        ProblemWithTags(id=10, difficulty="medium", tag_ids=[1], last_status=None),
        ProblemWithTags(id=11, difficulty="medium", tag_ids=[2], last_status=None),
    ]
    assert recommend_problems(mastery, problems)[0] == 10
