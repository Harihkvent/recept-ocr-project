import requests
import json

url = "http://localhost:8000/receipts/6992e3b15bcfbda94f07ba2e"
payload = {
    "fields": {
        "merchant": "Python Test Merchant",
        "date": "2026-02-16",
        "total": 123.45
    }
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.put(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
