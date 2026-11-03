"""Explicit capabilities of the bundled Python-subset worker, not CPython.

Each enabled lesson must pass the reference coverage check before release.
"""
UNAVAILABLE = {
    'py19': 'Срез с обратным шагом word[::-1] ещё не поддерживается.',
    'py20': 'Целочисленное деление // ещё не поддерживается.',
    'py21': 'Отрицательные индексы списка ещё не поддерживаются.',
    'py24': 'Целочисленное деление // ещё не поддерживается.',
    'py25': 'Проверка вхождения через in ещё не поддерживается.',
    'py26': 'Срез с обратным шагом word[::-1] ещё не поддерживается.',
    'mp13': 'Целочисленное деление // ещё не поддерживается.',
    'mooc07': 'Срез с обратным шагом text[::-1] ещё не поддерживается.',
    'mooc14': 'Кортежи ещё не поддерживаются.',
    'mooc19': 'Целочисленное деление // ещё не поддерживается.',
    'mooc20': 'Целочисленное деление // ещё не поддерживается.',
}
for number in range(1, 18):
    if number <= 8:
        reason = 'Классы и методы объектов ещё не поддерживаются.'
    elif number in (16, 17):
        reason = 'Классы, файлы и модули ещё не поддерживаются.'
    else:
        reason = 'Файлы и модули TXT/CSV/JSON ещё не поддерживаются.'
    UNAVAILABLE[f'adv{number:02d}'] = reason


def capability(lesson):
    if lesson.get('quizzes') and lesson.get('cases'):
        return {'mode': 'python-subset', 'reason': 'Код проверяется по нескольким входам в учебном поднаборе Python. Дополнительно ответь на вопрос понимания; часть возможностей полноценного CPython здесь не поддерживается.'}
    if lesson.get('quizzes'):
        return {'mode': 'concept-quiz', 'reason': 'Вопросы на понимание проверяются офлайн. Практический код здесь сохраняется как черновик; сложные темы требуют полноценного CPython. Это не проверка исполнения Python.'}
    if lesson['id'] in UNAVAILABLE:
        return {'mode': 'unavailable', 'reason': UNAVAILABLE[lesson['id']] +
                ' Теория и черновик доступны офлайн. Решение можно проверить в установленном Python на ноутбуке; автоматический зачёт здесь недоступен.'}
    if lesson['track'] in ('linux', 'sql'):
        return {'mode': 'text', 'reason': 'Сопоставление с учебным образцом без выполнения команды или запроса.'}
    if not lesson.get('cases'):
        return {'mode': 'unavailable', 'reason': 'Для этого урока пока нет автоматических тестов.'}
    return {'mode': 'python-subset', 'reason': 'Проверка учебным поднабором Python. Импорт модулей, файлы и полноценный Python недоступны.'}
