"""
Bias calibration test — validates that the judge_meaning and judge_naturalness
functions apply consistent strictness regardless of word difficulty.

6 test cases:
  3 correct usages (Easy / Medium / Hard) → all should get 'Correct'
  3 incorrect usages (Easy / Medium / Hard) → all should get 'Incorrect'
"""

import sys, os

# Ensure the backend package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.routers.practice import judge_meaning, judge_naturalness

# ── Test cases ────────────────────────────────────────────────────

CORRECT_CASES = [
    {
        "word": "thin",
        "difficulty": "Easy",
        "scene": "Your friend asks you to describe the soup they just made.",
        "sentence": "The soup is thin.",
    },
    {
        "word": "reluctant",
        "difficulty": "Medium",
        "scene": "Your manager asks if you can work this weekend.",
        "sentence": "I'm reluctant to work on the weekend.",
    },
    {
        "word": "eloquent",
        "difficulty": "Hard",
        "scene": "Your coworker asks how their presentation went.",
        "sentence": "You were very eloquent during the presentation.",
    },
]

INCORRECT_CASES = [
    {
        "word": "thin",
        "difficulty": "Easy",
        "scene": "Your friend asks you to describe the soup they just made.",
        "sentence": "I will thin about the soup later.",  # Wrong POS: using 'thin' as a verb meaning 'think'
    },
    {
        "word": "reluctant",
        "difficulty": "Medium",
        "scene": "Your manager asks if you can work this weekend.",
        "sentence": "The weekend is very reluctant.",  # Wrong sense: describing weekend as reluctant
    },
    {
        "word": "eloquent",
        "difficulty": "Hard",
        "scene": "Your coworker asks how their presentation went.",
        "sentence": "I ate an eloquent sandwich after the presentation.",  # Wrong sense: eloquent doesn't describe food
    },
]


def run_tests():
    print("=" * 70)
    print("BIAS CALIBRATION TEST — judge_meaning")
    print("=" * 70)

    print("\n--- CORRECT USAGE (all should be 'Correct') ---\n")
    for case in CORRECT_CASES:
        result = judge_meaning(
            case["word"], case["scene"], case["sentence"],
            difficulty=case["difficulty"],
        )
        status = "✅ PASS" if result.rating_word.lower() in ("correct",) else "❌ FAIL"
        print(f"  [{case['difficulty']:6s}] word={case['word']!r:15s} → rating_word={result.rating_word!r:12s}  {status}")
        print(f"          reasoning: {result.reasoning}")
        print()

    print("\n--- INCORRECT USAGE (all should be 'Incorrect') ---\n")
    for case in INCORRECT_CASES:
        result = judge_meaning(
            case["word"], case["scene"], case["sentence"],
            difficulty=case["difficulty"],
        )
        status = "✅ PASS" if result.rating_word.lower() in ("incorrect",) else "❌ FAIL"
        print(f"  [{case['difficulty']:6s}] word={case['word']!r:15s} → rating_word={result.rating_word!r:12s}  {status}")
        print(f"          reasoning: {result.reasoning}")
        print()

    print("=" * 70)
    print("BIAS CALIBRATION TEST — judge_naturalness (correct-usage cases only)")
    print("=" * 70)

    print("\n--- CORRECT NATURAL USAGE (none should be 'Awkward') ---\n")
    for case in CORRECT_CASES:
        result = judge_naturalness(
            case["word"], case["scene"], case["sentence"],
            difficulty=case["difficulty"],
        )
        status = "✅ PASS" if result.rating_word.lower() in ("native",) else "⚠️  CHECK"
        print(f"  [{case['difficulty']:6s}] word={case['word']!r:15s} → rating_word={result.rating_word!r:15s}  {status}")
        print(f"          reasoning: {result.reasoning}")
        print()


if __name__ == "__main__":
    run_tests()
