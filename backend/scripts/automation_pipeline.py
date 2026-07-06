import sqlite3
import csv
import re
from collections import defaultdict
import os
import chromadb

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "dev.db")
TSV_PATH = os.path.join(BASE_DIR, "data", "raw", "eng_sentences.tsv")
OUTPUT_CSV = os.path.join(BASE_DIR, "data", "processed", "word_examples.csv")
CHROMA_DB_PATH = os.path.join(BASE_DIR, "data", "chroma_db")
MAX_EXAMPLES_PER_WORD = 5  # Fetch up to 5 examples per word

def extract_sentences_to_csv():
    # 1. Fetch words from DB
    if not os.path.exists(DB_PATH):
        print(f"❌ DB not found at {DB_PATH}")
        return set()
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT text FROM word")
    words = {row[0].lower() for row in cursor.fetchall()}
    conn.close()
    
    print(f"📚 Loaded {len(words)} target words from DB.")

    # 2. Process TSV efficiently
    word_sentences = defaultdict(list)
    word_regex = re.compile(r'\b[a-z]+\b')
    active_words = set(words)

    print(f"🔍 Scanning {TSV_PATH} for examples...")
    if not os.path.exists(TSV_PATH):
        print(f"❌ TSV file not found at {TSV_PATH}")
        return set()

    with open(TSV_PATH, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if not active_words:
                print("✅ Found enough examples for all words. Stopping scan early.")
                break
                
            parts = line.strip().split('\t')
            if len(parts) != 3:
                continue
                
            sentence = parts[2]
            
            # Simple length filter to avoid weirdly short/long sentences
            if len(sentence) < 15 or len(sentence) > 150:
                continue
                
            tokens = set(word_regex.findall(sentence.lower()))
            matched_words = tokens & active_words
            
            for mw in matched_words:
                word_sentences[mw].append(sentence)
                if len(word_sentences[mw]) >= MAX_EXAMPLES_PER_WORD:
                    active_words.remove(mw)
                    
            if i > 0 and i % 500000 == 0:
                print(f"   ...Processed {i} lines (Active target words left: {len(active_words)})")

    # 3. Write to CSV
    with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["word", "sentence"])
        for word, sentences in word_sentences.items():
            for s in sentences:
                writer.writerow([word, s])
                
    print(f"✅ Saved examples to {OUTPUT_CSV}.")
    return words

def update_chromadb():
    print(f"\n🔄 Updating ChromaDB at {CHROMA_DB_PATH}...")
    if not os.path.exists(OUTPUT_CSV):
        print("❌ CSV not found. Run extraction first.")
        return
        
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_or_create_collection(name="vocab-examples")
    
    # Read CSV
    examples = []
    with open(OUTPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            examples.append((row["word"], row["sentence"]))
            
    if not examples:
        print("⚠️ No examples to insert.")
        return
        
    # Prepare batch insertion
    ids = []
    documents = []
    metadatas = []
    
    # To keep unique IDs
    word_counters = defaultdict(int)
    
    for word, sentence in examples:
        idx = word_counters[word]
        ids.append(f"{word}_{idx}")
        documents.append(sentence)
        metadatas.append({"word": word})
        word_counters[word] += 1

    # Insert into ChromaDB
    collection.add(ids=ids, documents=documents, metadatas=metadatas)
    print(f"✅ Successfully added {len(documents)} sentences to ChromaDB!")
    print(f"📊 Total items in ChromaDB: {collection.count()}")

if __name__ == "__main__":
    print("--- 🚀 Starting Automation Pipeline ---")
    extract_sentences_to_csv()
    update_chromadb()
    print("--- 🎉 Pipeline Complete ---")
