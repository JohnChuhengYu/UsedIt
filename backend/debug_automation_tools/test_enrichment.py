"""
Diagnostic: call GET /words/{id} for 3 newly-inserted words and report the full JSON response + timing.
"""
import requests
import time
import json
import sqlite3

DB_PATH = "dev.db"
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Pick 3 words spread across the sample: word #5 (animate), #50 (instilment), #95 (ubiquitous)
test_words = ["animate", "magazine", "ubiquitous"]

for word_text in test_words:
    cursor.execute("SELECT id FROM word WHERE text = ?", (word_text,))
    row = cursor.fetchone()
    if not row:
        print(f"Word '{word_text}' not found in DB, skipping")
        continue
    
    word_id = row[0]
    print(f"\n{'='*70}")
    print(f"TESTING: '{word_text}' (id={word_id})")
    print(f"{'='*70}")
    
    start = time.time()
    res = requests.get(f"http://localhost:8000/words/{word_id}")
    elapsed = time.time() - start
    
    print(f"Status: {res.status_code}")
    print(f"Time: {elapsed:.2f}s")
    
    if res.status_code == 200:
        data = res.json()
        print(f"\nFull JSON response:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        
        # Diagnostics
        print(f"\n--- Enrichment Diagnostics ---")
        print(f"  Free Dictionary API:")
        print(f"    definition populated: {bool(data.get('definition') and data['definition'] != '')}")
        print(f"    phonetic:  {data.get('phonetic', 'MISSING')}")
        print(f"    synonyms:  {data.get('synonyms', 'MISSING')}")
        print(f"    part_of_speech: {data.get('part_of_speech', 'MISSING')}")
        
        print(f"  Ollama AI:")
        tone = data.get('tone', '')
        memory = data.get('memory_aid', '')
        is_fallback = memory and "Think of a time when you had to be very" in memory
        print(f"    tone:       {tone}")
        print(f"    memory_aid: {memory}")
        print(f"    IS FALLBACK TEMPLATE: {'YES ⚠️' if is_fallback else 'NO ✅ (genuine AI)'}")
        
        print(f"  is_enriched: {data.get('is_enriched')}")
    else:
        print(f"ERROR: {res.text}")

conn.close()
