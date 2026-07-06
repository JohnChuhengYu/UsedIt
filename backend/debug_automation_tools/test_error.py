from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
response = client.get("/words/9")
print(response.status_code)
print(response.json())
