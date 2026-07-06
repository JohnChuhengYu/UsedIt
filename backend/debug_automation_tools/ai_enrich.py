"""
UsedIt — AI Database Enrichment Script
Uses local Ollama (llama3.1:8b) to generate high-quality data for each word:
  - tone (formal / neutral / informal / academic)
  - memory_aid (a vivid, grammatically correct mnemonic)
  - etymology (word origin if the AI knows it)
  - difficulty (Easy / Medium / Hard based on AI judgment)

Skips words that already have non-template AI-generated content.
"""

import sqlite3
import requests
import json
import time
import sys

DB_PATH = "dev.db"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.1:8b"

PROMPT_TEMPLATE = """You are a vocabulary enrichment assistant. For the English word "{word}", provide the following in a valid JSON object with NO extra text before or after:

{{
  "definition": "A single, clear sentence defining the word as commonly used. Do not exceed 20 words.",
  "synonyms": "2-3 common synonyms, comma-separated (e.g. 'articulate, fluent'). Use null if none exist.",
  "antonyms": "2-3 common antonyms, comma-separated (e.g. 'inarticulate, tongue-tied'). Use null if none exist."
}}

Do not include example sentences, explanations, or any text outside the JSON object.
Respond with ONLY the JSON object, nothing else."""


def call_ollama(word: str) -> dict | None:
    """Call Ollama and parse the JSON response."""
    try:
        res = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": PROMPT_TEMPLATE.format(word=word),
                "stream": False,
                "options": {"temperature": 0.7, "num_predict": 300}
            },
            timeout=30
        )
        if res.status_code != 200:
            return None
        
        raw = res.json().get("response", "")
        # Try to extract JSON from the response
        # Sometimes the model wraps it in markdown code blocks
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        if raw.endswith("```"):
            raw = raw[:-3]
        
        return json.loads(raw.strip())
    except (json.JSONDecodeError, requests.RequestException) as e:
        print(f"    ⚠ Parse/request error: {e}")
        return None


def is_missing_fields(definition: str | None, synonyms: str | None, antonyms: str | None) -> bool:
    """Check if any target fields are missing."""
    return not definition or not synonyms or not antonyms


def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Find words that need AI enrichment:
    # - definition, synonyms, or antonyms is NULL or empty
    cursor.execute("""
        SELECT id, text, definition, synonyms, antonyms
        FROM word 
        ORDER BY id
    """)
    all_words = cursor.fetchall()
    
    to_enrich = []
    for wid, text, definition, synonyms, antonyms in all_words:
        if is_missing_fields(definition, synonyms, antonyms):
            to_enrich.append((wid, text))
    
    print(f"Total words in DB: {len(all_words)}")
    print(f"Words needing AI enrichment: {len(to_enrich)}")
    
    if not to_enrich:
        print("All words already have AI-generated content. Nothing to do!")
        return
    
    # Test Ollama connectivity
    print(f"\nTesting Ollama ({MODEL})...")
    test = call_ollama("test")
    if test is None:
        print("❌ Cannot reach Ollama or parse response. Aborting.")
        sys.exit(1)
    print(f"✅ Ollama is responsive. Starting enrichment...\n")
    
    success = 0
    failed = 0
    
    for i, (wid, text) in enumerate(to_enrich):
        print(f"[{i+1}/{len(to_enrich)}] {text}...", end=" ", flush=True)
        
        result = call_ollama(text)
        
        if result:
            definition = result.get("definition")
            synonyms = result.get("synonyms")
            antonyms = result.get("antonyms")
            
            # Use SQLite NULLIF to avoid overwriting existing non-empty values with generated ones
            cursor.execute("""
                UPDATE word 
                SET 
                    definition = COALESCE(NULLIF(definition, ''), ?),
                    synonyms = COALESCE(NULLIF(synonyms, ''), ?),
                    antonyms = COALESCE(NULLIF(antonyms, ''), ?)
                WHERE id = ?
            """, (definition, synonyms, antonyms, wid))
            conn.commit()
            
            print(f"✅ def={bool(definition)}, syn={bool(synonyms)}, ant={bool(antonyms)}")
            success += 1
        else:
            print("❌ failed")
            failed += 1
        
        # Small delay between requests to avoid overwhelming the GPU
        time.sleep(0.5)
    
    print(f"\n{'='*60}")
    print(f"AI ENRICHMENT COMPLETE")
    print(f"  ✅ Success: {success}")
    print(f"  ❌ Failed:  {failed}")
    
    # Final stats
    cursor.execute("SELECT COUNT(*) FROM word WHERE definition IS NOT NULL AND definition != '' AND synonyms IS NOT NULL AND synonyms != '' AND antonyms IS NOT NULL AND antonyms != ''")
    ai_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM word")
    total = cursor.fetchone()[0]
    print(f"  Words with all 3 fields complete: {ai_count}/{total}")
    
    conn.close()


if __name__ == "__main__":
    main()
