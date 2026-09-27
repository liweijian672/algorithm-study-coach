from app.models import Problem
from app.services.coaching import (
    generate_explanation,
    generate_hints,
    generate_solutions,
)


def test_coaching_generation_is_cached(fake_client):
    problem = Problem(id=1, platform="niuke", source_id="NC1", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    first = generate_explanation(problem, fake_client)
    second = generate_explanation(problem, fake_client)
    assert first == second
    assert fake_client.calls == 1


def test_generate_hints_returns_three_hints(fake_client):
    problem = Problem(id=1, platform="niuke", source_id="NC1", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    hints = generate_hints(problem, fake_client)
    assert len(hints) == 3


def test_generate_solutions_returns_two_cpp_solutions(fake_client):
    problem = Problem(id=1, platform="niuke", source_id="NC1", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    solutions = generate_solutions(problem, fake_client)
    assert len(solutions) >= 2
    assert all(s.language == "cpp" and s.code for s in solutions)


def test_generate_hints_parses_fenced_json(client):
    class Client:
        def complete(self, prompt: str) -> str:
            return '```json\n{"hints":["先暴力","再优化","写代码"]}\n```'

    problem = Problem(id=9, platform="niuke", source_id="NC9", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    assert generate_hints(problem, Client()) == ["先暴力", "再优化", "写代码"]


def test_generate_solutions_parses_json(client):
    class Client:
        def complete(self, prompt: str) -> str:
            return '{"solutions":[{"language":"cpp","code":"int main(){}","complexity":"O(n)"}]}'

    problem = Problem(id=10, platform="niuke", source_id="NC10", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    solutions = generate_solutions(problem, Client())
    assert len(solutions) >= 1
    assert solutions[0].language == "cpp"
    assert solutions[0].code == "int main(){}"
