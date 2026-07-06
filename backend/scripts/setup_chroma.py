import chromadb

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMA_DB_PATH = os.path.join(BASE_DIR, "data", "chroma_db")
client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

# Create (or get) the collection
collection = client.get_or_create_collection(name="vocab-examples")

# Test data: 3 real example sentences per word
data = {
    "eloquent": [
        "She gave an eloquent speech that moved the entire audience.",
        "He's known for being eloquent in interviews.",
        "The lawyer's eloquent closing argument won the case.",
    ],
    "procrastinate": [
        "I always procrastinate when it comes to writing essays.",
        "Stop procrastinating and start your homework.",
        "She tends to procrastinate on tasks she finds boring.",
    ],
}

# Insert each entry with id format "{word}_{index}" and metadata recording the word
ids = []
documents = []
metadatas = []

for word, sentences in data.items():
    for index, sentence in enumerate(sentences):
        ids.append(f"{word}_{index}")
        documents.append(sentence)
        metadatas.append({"word": word})

collection.add(ids=ids, documents=documents, metadatas=metadatas)

# Validation: print the total count
print(f"Total entries stored: {collection.count()}")

# Print all stored documents to confirm data correctness
all_data = collection.get()
print("\nAll stored documents:")
for doc_id, document, metadata in zip(all_data["ids"], all_data["documents"], all_data["metadatas"]):
    print(f"  [{doc_id}] ({metadata['word']}): {document}")
