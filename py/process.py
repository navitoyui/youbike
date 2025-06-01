import csv
import json
import requests
import time
import os
import re

GOOGLE_API_KEY = "AIzaSyDgtDeWRhHdZgUzdGkDCJEDQBvwWPh84CU"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
TAIPEI_KEYWORDS = ["台北市", "臺北市"]

os.chdir(os.path.dirname(__file__))
print("已切換目錄：", os.getcwd())

def clean_address(addr):
    return re.sub(r'（.*?）', '', addr)

def geocode(address):
    params = {
        "address": address,
        "key": GOOGLE_API_KEY,
        "language": "zh-TW"
    }
    try:
        r = requests.get(GEOCODE_URL, params=params)
        r.raise_for_status()
        results = r.json().get("results", [])
        if results:
            location = results[0]['geometry']['location']
            display_name = results[0]['formatted_address']
            return location['lat'], location['lng'], display_name
        else:
            return None
    except Exception as e:
        print(f"Geocode error for {address}: {e}")
        return None

def is_in_taipei(display_name):
    return any(kw in display_name for kw in TAIPEI_KEYWORDS)

def process_csv(input_csv, output_json):
    processed = []
    with open(input_csv, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            addr = row.get('Location') or row.get('地點') or row.get('地址') or ""
            if not addr:
                continue
            cleaned = clean_address(addr)
            geo = geocode(cleaned)
            time.sleep(0.5) 
            if geo:
                lat, lng, display_name = geo
                if is_in_taipei(display_name):
                    row['lat'] = lat
                    row['lng'] = lng
                    processed.append(row)
                else:
                    print(f"排除：{addr}")
            else:
                print(f"無法定位：{addr}")
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(processed, f, ensure_ascii=False, indent=2)
    print(f"{output_json} finish，total: {len(processed)}")

if __name__ == "__main__":
    process_csv("../csv/emperor_coming.csv", "../json/exhibitions_coming_taipei.json")
    process_csv("../csv/emperor_now.csv", "../json/exhibitions_now_taipei.json")
