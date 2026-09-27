from app.services.json_utils import extract_json


def test_extract_json_from_surrounding_text():
    raw = 'Here is the answer: {"tags": ["array", "hash"]} Thanks!'
    assert extract_json(raw) == {"tags": ["array", "hash"]}


def test_extract_json_from_fenced_block():
    raw = '```json\n{"hints": ["hint-a", "hint-b"]}\n```'
    assert extract_json(raw) == {"hints": ["hint-a", "hint-b"]}


def test_extract_json_returns_none_for_plain_text():
    assert extract_json("not json at all") is None
