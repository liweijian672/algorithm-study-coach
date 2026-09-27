from app.models import Problem, Tag
from app.services.tagging import assign_tags


def test_assign_tags_keeps_only_known_tags(fake_client):
    problem = Problem(id=1, platform="niuke", source_id="NC1", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    tags = [Tag(id=1, name="array"), Tag(id=2, name="hash")]
    result = assign_tags(problem, tags, fake_client)
    assert {a.tag_id for a in result} == {1, 2}


def test_assign_tags_handles_malformed_response(fake_malformed_client):
    problem = Problem(id=1, platform="niuke", source_id="NC1", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    tags = [Tag(id=1, name="array")]
    assert assign_tags(problem, tags, fake_malformed_client) == []

