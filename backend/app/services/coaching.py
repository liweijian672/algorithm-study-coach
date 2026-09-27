from dataclasses import dataclass

from ..models import Problem
from .cache import get_or_create
from .json_utils import extract_json
from .llm_client import LLMClient


@dataclass
class Solution:
    language: str
    code: str
    complexity: str


def _cache_key(problem: Problem, purpose: str) -> str:
    return f"{problem.id}:{purpose}"


def generate_explanation(problem: Problem, client: LLMClient) -> str:
    return get_or_create(
        _cache_key(problem, "explanation"),
        lambda: client.complete(
            f"请用中文讲解算法题《{problem.title}》。"
            "输出解题思路、关键步骤、时间复杂度和空间复杂度，"
            "最后给出 C++ 代码。使用 Markdown。",
        ),
    )


def generate_hints(problem: Problem, client: LLMClient) -> list[str]:
    raw = get_or_create(
        _cache_key(problem, "hints"),
        lambda: client.complete(
            f"请为算法题《{problem.title}》给出三个渐进式提示。"
            '只返回 JSON：{"hints":["提示1","提示2","提示3"]}。',
        ),
    )
    payload = extract_json(raw)
    if isinstance(payload, list):
        hints = [str(item) for item in payload]
    elif isinstance(payload, dict) and isinstance(payload.get("hints"), list):
        hints = [str(item) for item in payload["hints"]]
    else:
        hints = []
    while len(hints) < 3:
        hints.append("从最简单的暴力解法开始思考。")
    return hints[:3]


def generate_solutions(problem: Problem, client: LLMClient) -> list[Solution]:
    raw = get_or_create(
        _cache_key(problem, "solutions"),
        lambda: client.complete(
            f"请为算法题《{problem.title}》给出两种 C++ 解法。"
            '只返回 JSON：{"solutions":[{"language":"cpp","code":"...",'
            '"complexity":"O(n)"}]}。',
        ),
    )
    payload = extract_json(raw)
    if isinstance(payload, dict) and isinstance(payload.get("solutions"), list):
        payload = payload["solutions"]
    if not isinstance(payload, list):
        payload = []
    solutions = []
    for item in payload:
        if isinstance(item, dict) and item.get("code"):
            solutions.append(
                Solution(
                    language=item.get("language", "cpp"),
                    code=str(item["code"]),
                    complexity=str(item.get("complexity", "")),
                ),
            )
    while len(solutions) < 2:
        solutions.append(
            Solution(language="cpp", code="// 请在实现计划中补充具体解法", complexity=""),
        )
    return solutions

