import json
import re


def _balanced_slice(text: str, start: int) -> str | None:
    opening = text[start]
    closing = "}" if opening == "{" else "]"
    pairs = {"{": "}", "[": "]"}
    stack: list[str] = []
    in_string = False
    escaped = False

    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char in pairs:
            stack.append(pairs[char])
        elif char in ("}", "]"):
            if not stack or stack[-1] != char:
                return None
            stack.pop()
            if not stack:
                return text[start : index + 1]

    return None


def extract_json(raw: str | None):
    text = (raw or "").strip()
    if not text:
        return None

    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    starts = [index for index in (text.find("{"), text.find("[")) if index != -1]
    if not starts:
        return None

    for start in sorted(starts):
        balanced = _balanced_slice(text, start)
        if balanced is None:
            continue
        try:
            return json.loads(balanced)
        except json.JSONDecodeError:
            continue

    return None
