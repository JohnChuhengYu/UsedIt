import requests

BASE_URL = "http://localhost:8000"

def test_endpoints():
    word_id = 1
    print(f"Testing /words/{word_id}/scene...")
    try:
        res = requests.get(f"{BASE_URL}/words/{word_id}/scene", timeout=30)
        print("Status Code:", res.status_code)
        scene_data = res.json()
        print("Response JSON:", scene_data)
        
        scene = scene_data.get("scene", "")
        if not scene:
            print("❌ No scene returned.")
            return

        print("\nTesting /words/{word_id}/judge...")
        sentence = "This is a test sentence."
        res_judge = requests.post(
            f"{BASE_URL}/words/{word_id}/judge", 
            params={"scene": scene, "sentence": sentence},
            timeout=30
        )
        print("Status Code:", res_judge.status_code)
        print("Response JSON:", res_judge.json())

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_endpoints()
