"""
One-time seed script: import 100 sampled words from vocab_combined.csv into the UsedIt SQLite database.
Uses fixed-interval sampling (every ~70th word) for alphabet coverage.
"""

import csv
import re
import sqlite3
import os

CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "vocab_combined.csv")
DB_PATH = os.path.join(os.path.dirname(__file__), "dev.db")

# 1. Read all words from CSV
with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
    reader = csv.reader(f)
    header = next(reader)  # skip header
    all_words = [row[0].strip().lower() for row in reader if row]

print(f"Total words in CSV: {len(all_words)}")

# 2. Fixed-interval sampling: every 70th word, targeting 100 words
INTERVAL = len(all_words) // 100  # ~70
sampled = []
i = 0
while len(sampled) < 100 and i < len(all_words):
    word = all_words[i]
    # Skip malformed words: must be alphabetic (allow hyphens), no spaces, 2+ chars
    if re.match(r'^[a-z][a-z\-]+$', word) and len(word) >= 2:
        sampled.append(word)
    else:
        # Try the next word in sequence
        j = i + 1
        while j < len(all_words) and j < i + INTERVAL:
            candidate = all_words[j]
            if re.match(r'^[a-z][a-z\-]+$', candidate) and len(candidate) >= 2:
                sampled.append(candidate)
                break
            j += 1
    i += INTERVAL

print(f"Sampled {len(sampled)} words")
print(f"First 10: {sampled[:10]}")
print(f"Last 10:  {sampled[-10:]}")

# 3. Connect to DB and insert
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get existing words
cursor.execute("SELECT text FROM word")
existing = set(row[0] for row in cursor.fetchall())
print(f"Existing words in DB: {len(existing)}")

inserted = 0
skipped_dup = 0
skipped_words = []

from datetime import datetime, timezone

for word in sampled:
    if word in existing:
        skipped_dup += 1
        skipped_words.append(word)
        continue
    
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "INSERT INTO word (text, definition, example, status, is_enriched, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (word, "", "", "NEW", False, now)
    )
    inserted += 1

conn.commit()

# 4. Summary
print(f"\n{'='*50}")
print(f"SEED COMPLETE")
print(f"  Inserted: {inserted}")
print(f"  Skipped (duplicates): {skipped_dup}")
if skipped_words:
    print(f"  Duplicate words: {skipped_words}")

# Verify total
cursor.execute("SELECT COUNT(*) FROM word")
total = cursor.fetchone()[0]
print(f"  Total words in DB now: {total}")

# Print all sampled words for reference
print(f"\nAll {len(sampled)} sampled words:")
for idx, w in enumerate(sampled):
    print(f"  {idx+1:3d}. {w}")

conn.close()
