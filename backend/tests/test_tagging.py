from app.models import Problem, ProblemTag, Tag
from app.services.tagging import assign_tags, tag_and_store_problem


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


def test_assign_tags_matches_chinese_display_name():
    class Client:
        def complete(self, prompt: str) -> str:
            return '{"tags": ["数组", "哈希表"]}'

    problem = Problem(id=1, platform="niuke", source_id="NC1", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    tags = [Tag(id=1, name="array", display_name="数组"),
            Tag(id=2, name="hash", display_name="哈希表")]
    result = assign_tags(problem, tags, Client())
    assert {a.tag_id for a in result} == {1, 2}


def test_tag_and_store_problem_persists_links(session):
    class Client:
        def complete(self, prompt: str) -> str:
            return '{"tags": ["array"]}'

    problem = Problem(platform="niuke", source_id="NC1", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    session.add(problem)
    session.commit()

    count = tag_and_store_problem(problem, session, Client())
    assert count == 1
    links = session.query(ProblemTag).filter_by(problem_id=problem.id).all()
    assert len(links) == 1

