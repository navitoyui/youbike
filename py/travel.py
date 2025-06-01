import sys
import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

options = Options()
options.add_argument("--headless")
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
print("after driver")
sys.stdout.flush()
driver = webdriver.Chrome(options=options)
print("driver")
sys.stdout.flush()


url = "https://www.accupass.com/search?c=travel"
driver.get(url)
print("open web")
sys.stdout.flush()
time.sleep(5)

for i in range(20):
    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.END)
    time.sleep(3)
    print(f"slip {i+1}")
    sys.stdout.flush()


elements = driver.find_elements(By.CSS_SELECTOR, "a[href^='/event/']")
print(f"elements: {len(elements)}")
sys.stdout.flush()


event_links = [e.get_attribute("href") for e in elements]

event_links = list(dict.fromkeys(event_links))

print(f"total : {len(event_links)}")
sys.stdout.flush()

data = []
wait = WebDriverWait(driver, 10)
num = 1
road1 = '/html/body/div[1]/div/div/div/div[3]/div[1]/div[1]/div[1]/div[2]/main/'


for link in event_links:
    driver.get(link)
    time.sleep(3)
    sys.stdout.flush()

    try:
        img = wait.until(EC.presence_of_element_located(
            (By.XPATH, '/html/body/div[1]/div/div/div/div[3]/div[1]/div[1]/div[1]/div[1]/img')
        )).get_attribute("src")
    except Exception as e:
        img = ""
    try:
        title = wait.until(EC.presence_of_element_located(
            (By.XPATH, road1 + 'section[1]/div[2]/h1')
        )).text
    except Exception as e:
        title = ""
    try:
        time_info = driver.find_element(By.XPATH, road1 + 'section[1]/div[4]/div[1]/div/div').text
    except Exception as e:
        time_info = ""
    try:
        location = driver.find_element(By.XPATH, road1 + 'section[1]/div[4]/div[2]/div/a/div').text
    except Exception as e:
        location = ""
    try:
        organizer = driver.find_element(By.XPATH, road1 + 'section[1]/div[4]/div[3]/div/a').text
    except Exception as e:
        organizer = ""
    try:
        organizer_link = driver.find_element(By.XPATH, road1 + 'section[1]/div[4]/div[3]/div/a').get_attribute("href")
    except Exception as e:
        organizer_link = ""
    try:
        description = driver.find_element(
            By.XPATH, road1 + "section[2]//article[contains(@class, 'EventDetail-module-f5e97a44-event-content')]"
        ).text
    except Exception as e:
        description = ""
    try:
        member = driver.find_element(By.XPATH, '/html/body/div[1]/div/div/div/div[3]/div[1]/div/div[1]/section[1]/div/div/div[2]').text
    except Exception as e:
        member = ""
    try:
        join = driver.find_element(By.XPATH, '/html/body/div[1]/div/div/div/div[3]/div[1]/div/div[1]/div[2]/div/div[2]/div/div[2]/a').get_attribute("href")
    except Exception as e:
        join = ""

    data.append({
        "活動名稱": title,
        "封面照片": img,
        "活動時間": time_info,
        "舉辦地點": location,
        "舉辦單位名稱": organizer,
        "舉辦單位連結": organizer_link,
        "活動簡介": description,
        "嘉賓名單": member,
        "活動連結": link,
        "報名連結": join
    })
    print(num)
    sys.stdout.flush()
    num += 1

# 儲存為 CSV
df = pd.DataFrame(data)
df.to_csv("../csv/accupass_travel.csv", index=False, encoding="utf-8-sig")
print("save accupass_travel.csv")
sys.stdout.flush()

# 關閉瀏覽器
driver.quit()
