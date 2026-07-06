"""
One-time batch re-enrichment: reset is_enriched for words with empty definitions,
then call GET /words/{id} to trigger re-enrichment with the fixed pipeline.
"""

import sqlite3
import requests
import time

DB_PATH = "dev.db"
API_BASE = "http://localhost:8000"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 1. Find words that were marked enriched but have no definition
cursor.execute("SELECT id, text FROM word WHERE is_enriched = 1 AND (definition IS NULL OR definition = '')")
stale = cursor.fetchall()
print(f"Found {len(stale)} words marked enriched but missing definitions")

# Also get un-enriched words
cursor.execute("SELECT id, text FROM word WHERE is_enriched = 0 AND (definition IS NULL OR definition = '')")
unenriched = cursor.fetchall()
print(f"Found {len(unenriched)} un-enriched words with no definition")

# 2. Reset is_enriched for stale words so the pipeline re-runs
if stale:
    ids = [row[0] for row in stale]
    placeholders = ",".join("?" * len(ids))
    cursor.execute(f"UPDATE word SET is_enriched = 0 WHERE id IN ({placeholders})", ids)
    conn.commit()
    print(f"Reset is_enriched=0 for {len(stale)} stale words")

# 3. Combine all words that need enrichment
all_to_enrich = stale + unenriched
print(f"\nTotal words to enrich: {len(all_to_enrich)}")

# 4. Call API for each word (with rate limiting to be nice to Free Dictionary API)
success = 0
failed = 0
no_def = 0

for i, (wid, text) in enumerate(all_to_enrich):
    try:
        res = requests.get(f"{API_BASE}/words/{wid}", timeout=15)
        if res.status_code == 200:
            data = res.json()
            definition = data.get("definition", "")
            if definition:
                success += 1
            else:
                no_def += 1
            if (i + 1) % 10 == 0:
                print(f"  [{i+1}/{len(all_to_enrich)}] enriched '{text}' — def={'YES' if definition else 'NO'}")
        else:
            failed += 1
            print(f"  [{i+1}] FAILED '{text}' — status {res.status_code}")
    except Exception as e:
        failed += 1
        print(f"  [{i+1}] ERROR '{text}': {e}")
    
    # Rate limit: 0.3s between requests to avoid hammering the dictionary API
    time.sleep(0.3)

print(f"\n{'='*50}")
print(f"ENRICHMENT COMPLETE")
print(f"  With definition: {success}")
print(f"  No definition (API had no data): {no_def}")
print(f"  Failed: {failed}")

# 5. Final verification
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM word WHERE definition IS NOT NULL AND definition != ''")
with_def = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM word")
total = cursor.fetchone()[0]
print(f"\n  Words with definitions: {with_def}/{total}")

conn.close()
