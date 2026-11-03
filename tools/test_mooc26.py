"""Check MOOC-inspired Russian lessons, sequential route, and honest capabilities."""
import json
import sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "curriculum_source"))
from codementor.content_mooc26_full import MOOC26
from codementor.content import ALL
from codementor.checking import capability

assert len(MOOC26) == 98
assert {x["moocPart"] for x in MOOC26} == set(range(1, 15))
assert len({x["id"] for x in MOOC26}) == len(MOOC26)
ids = [x["id"] for x in MOOC26]
for index, item in enumerate(MOOC26):
    assert item["track"] == "mooc"
    assert item["prerequisites"] == ([] if index == 0 else [ids[index - 1]])
    assert capability(item)["mode"] == "concept-quiz"
    assert "programming-26.mooc.fi/part-" in item["source_url"]
    assert item["practiceKind"] == "concept-and-code-draft"
    assert len(item["intro"]) >= 45, item["id"]
    assert len(item["example"]) >= 20, item["id"]
    assert len(item["theory"]) >= 3
    assert all(len(text) >= 30 for text in item["theory"]), item["id"]
    assert len(item["task"]) >= 40, item["id"]
    assert all(item["learning"].get(key) for key in
        ("walkthrough", "first", "medium", "independent", "errors", "review", "checkpoint"))
    assert item["starter"].startswith("#")
    assert not item["cases"], "Do not pretend arbitrary CPython code is executed"
    assert not item.get("solution")
    for quiz in item["quizzes"]:
        assert quiz["id"] not in ids
        assert len(quiz["options"]) == 3
        assert len(set(quiz["options"])) == 3
        assert 0 <= quiz["answer"] < 3
        assert len(quiz["question"]) >= 18
        assert len(quiz["explanation"]) >= 35
        assert len(quiz["wrongExplanation"]) >= 30
assert len(ALL) == len({x["id"] for x in ALL})
source = root / "curriculum_source" / "codementor"
assert len(json.loads((source / "mooc26_core.json").read_text())) == 7
assert len(json.loads((source / "mooc26_advanced.json").read_text())) == 7
print("PASS MOOC26: 14 original parts, 98 conceptual lessons, valid sequential prerequisites and checks")
