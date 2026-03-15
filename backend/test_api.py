import json
import urllib.request
import urllib.error

url = 'http://127.0.0.1:5000/api/scan/start'
data = json.dumps({'network_range': '192.168.1.1', 'ports': '80'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print("STATUS:", response.status)
        print("BODY:", response.read().decode())
except urllib.error.HTTPError as e:
    print("STATUS:", e.code)
    print("BODY:", e.read().decode())
except Exception as e:
    print("ERROR:", e)
