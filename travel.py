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

# 初始化 Selenium 瀏覽器（無頭模式）
options = Options()
options.add_argument("--headless")  # 啟用無頭模式
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
print("啟動 Chrome driver 前")
sys.stdout.flush()
driver = webdriver.Chrome(options=options)
print("已啟動 driver")
sys.stdout.flush()

# 目標頁面
url = "https://www.accupass.com/search?c=travel"
driver.get(url)
print("已開啟網頁")
sys.stdout.flush()
time.sleep(5)

# 模擬下滑載入更多活動（可調整次數）
for i in range(20):
    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.END)
    time.sleep(3)
    print(f"已下滑 {i+1} 次")
    sys.stdout.flush()

# 抓取所有活動連結 <a href="/event/...">
elements = driver.find_elements(By.CSS_SELECTOR, "a[href^='/event/']")
print(f"elements: {len(elements)}")
sys.stdout.flush()

# 將 href 加上主機名稱變成完整網址
event_links = [e.get_attribute("href") for e in elements]
# 去重但保留順序
event_links = list(dict.fromkeys(event_links))

print(f"共找到 {len(event_links)} 筆活動連結")
sys.stdout.flush()

data = []
wait = WebDriverWait(driver, 10)
num = 1
road1 = '/html/body/div[1]/div/div/div/div[3]/div[1]/div[1]/div[1]/div[2]/main/'

# 逐一打開活動連結並提取資訊
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
df.to_csv("accupass_travel.csv", index=False, encoding="utf-8-sig")
print("已儲存 accupass_travel.csv")
sys.stdout.flush()

# 關閉瀏覽器
driver.quit()
