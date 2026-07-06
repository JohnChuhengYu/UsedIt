import chromadb

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMA_DB_PATH = os.path.join(BASE_DIR, "data", "chroma_db")
client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

try:
    # Try to access the collection
    collection = client.get_collection(name="vocab-examples")
    print(f"✅ Successfully connected to ChromaDB!")
    print(f"Total documents in 'vocab-examples' collection: {collection.count()}")

    print("\n" + "="*50)
    print("ALL DOCUMENTS:")
    print("="*50)

    # Fetch all documents
    results = collection.get()
    
    # Iterate through the documents and print them out neatly
    for doc_id, doc, metadata in zip(results["ids"], results["documents"], results["metadatas"]):
        word = metadata.get("word", "Unknown Word")
        print(f"[{word}] (ID: {doc_id})")
        print(f"   -> {doc}")
        print("-" * 50)
        
except Exception as e:
    print(f"❌ Error accessing collection: {e}")
