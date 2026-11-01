"""Stream test references to Node; do not put solutions in Android assets."""
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'curriculum_source'))
from codementor.content import ALL
print(json.dumps({item['id']: item.get('solution') for item in ALL}))
