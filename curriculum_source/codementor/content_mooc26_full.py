"""Original Russian lessons following the topic progression of Helsinki MOOC 2026.

The university's exercises, texts and reference solutions are NOT copied.
CC BY-NC-SA 4.0 applies to the original course material; this project uses
its public table of contents as topic inspiration with source links only.
Questions assess conceptual understanding, NOT arbitrary code execution.
"""
import json
from pathlib import Path

_FOLDER = Path(__file__).resolve().parent
PARTS = []
for _name in ("mooc26_core.json", "mooc26_advanced.json"):
    PARTS.extend(json.loads((_FOLDER / _name).read_text(encoding="utf-8")))
assert [p["part"] for p in PARTS] == list(range(1, 15))
MOOC26 = []
for part in PARTS:
    n = part["part"]
    for i, row in enumerate(part["rows"], 1):
        title, life, concept, example, walkthrough, mistake, task, question, correct, wrong_a, wrong_b = row
        lid = f"mooc26-p{n:02d}-l{i:02d}"
        # Vary the correct option to prevent a positional shortcut.
        options = [correct, wrong_a, wrong_b]
        offset = (n + i) % 3
        options = options[offset:] + options[:offset]
        assert len(set(options)) == 3, lid
        question_id = lid + ":q1"
        previous = (MOOC26[-1]["id"] if MOOC26 else None)
        level = (0 if n <= 2 else 1 if n <= 4 else 2 if n <= 7 else
                 3 if n <= 10 else 4 if n <= 12 else 5)
        MOOC26.append({
            "id": lid, "track": "mooc", "moocPart": n,
            "module": f"MOOC 2026 · Часть {n:02d}: {part['module']}",
            "title": f"{n}.{i} · {title}",
            "level": ["С нуля", "Начальный", "Базовый", "Средний", "Продвинутый", "Высокий"][level],
            "curriculumLevel": level,
            "intro": life,
            "theory": [concept, "Разберём пример: " + walkthrough,
                       "Частая ошибка: " + mistake],
            "example": example,
            "task": task,
            "starter": "# Здесь можно написать решение практического задания.\n# Для тем, которые не поддерживает учебный движок,\n# запускай код в установленном CPython.\n",
            "cases": [],
            "prerequisites": [previous] if previous else [],
            "hints": [concept, mistake],
            "learning": {
                "walkthrough": [concept, walkthrough],
                "first": "Прочитай код из примера сверху вниз. "
                         "Объясни, что происходит перед получением результата.",
                "medium": "Поменяй один вход или параметр в примере. "
                          "Запиши предположение до запуска и сравни его с результатом в CPython.",
                "independent": task,
                "errors": mistake,
                "review": "Вспомни смысл предыдущего примера и назови отличия от этой темы.",
                "checkpoint": question,
            },
            "quizzes": [{
                "id": question_id,
                "question": question,
                "options": options,
                "answer": options.index(correct),
                "explanation": "Правильный вариант: " + correct + ". " + walkthrough,
                "wrongExplanation": "Подумай, что делает каждая строка и что именно "
                                    "проверяется. " + mistake,
                "hint": concept,
            }],
            "source_url": f"https://programming-26.mooc.fi/part-{n}/",
            "source_note": "Темы соответствуют части MOOC 2026; объяснения и задания CodeMentor оригинальные",
            "practiceKind": "concept-and-code-draft",
        })
assert len(MOOC26) == 98
