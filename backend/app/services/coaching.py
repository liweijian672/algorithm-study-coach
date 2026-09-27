import json
from dataclasses import dataclass

from ..models import Problem
from .cache import get_or_create
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
        lambda: client.complete(f"Explain the solution for {problem.title}."),
    )


def generate_hints(problem: Problem, client: LLMClient) -> list[str]:
    raw = get_or_create(
        _cache_key(problem, "hints"),
        lambda: client.complete(f"Give three progressive hints for {problem.title}."),
    )
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        payload = None
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
        lambda: client.complete(f"Give two C++ solutions for {problem.title}."),
    )
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        payload = None
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

