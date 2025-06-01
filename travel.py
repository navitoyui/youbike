import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys

# 初始化 Selenium 瀏覽器（無頭模式）
options = Options()
# options.add_argument("--headless")  # 不開啟瀏覽器視窗
# options.add_argument("--disable-gpu")
driver = webdriver.Chrome(options=options)

# 目標頁面
url = "https://www.accupass.com/search?c=travel"
driver.get(url)
time.sleep(5)

# 模擬下滑載入更多活動（可調整次數）
for _ in range(20):
    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.END)
    time.sleep(3)


# 抓取所有活動連結 <a href="/event/...">
elements = driver.find_elements(By.CSS_SELECTOR, "a[href^='/event/']")

# 將 href 加上主機名稱變成完整網址
event_links = [e.get_attribute("href") for e in elements]

# 去除重複連結
# 去重但保留順序
event_links = list(dict.fromkeys(event_links))


print(f"共找到 {len(event_links)} 筆活動連結")
# print(event_links[0:3])

data = []
t = 0.1
num = 1
# event_links = event_links[0:3]
road1 = '/html/body/div[1]/div/div/div/div[3]/div[1]/div[1]/div[1]/div[2]/main/'
# 逐一打開活動連結並提取資訊
for link in event_links:
    driver.get(link)
    time.sleep(3)

    try:
        img = driver.find_element(By.XPATH, '/html/body/div[1]/div/div/div/div[3]/div[1]/div[1]/div[1]/div[1]/img').get_attribute("src")
    except:
        img = ""
    time.sleep(t)
    
    
    try:
        title = driver.find_element(By.XPATH, road1 + 'section[1]/div[2]/h1').text
    except:
        title = ""
    time.sleep(t)


    try:
        time_info = driver.find_element(By.XPATH, road1 + 'section[1]/div[4]/div[1]/div/div').text
    except:
        time_info = ""
    time.sleep(t)

    try:
        location = driver.find_element(By.XPATH, road1 + 'section[1]/div[4]/div[2]/div/a/div').text
    except:
        location = ""
    time.sleep(t)


    try:
        organizer = driver.find_element(By.XPATH, road1 + 'section[1]/div[4]/div[3]/div/a').text
    except:
        organizer = ""
    time.sleep(t)

    try:
        organizer_link = driver.find_element(By.XPATH, road1 + 'section[1]/div[4]/div[3]/div/a').get_attribute("href")
    except:
        organizer_link = ""
    time.sleep(t)

    try:
        description = driver.find_element(By.XPATH, road1 + "section[2]//article[contains(@class, 'EventDetail-module-f5e97a44-event-content')]").get_attribute('innerHTML')

    except:
        description = ""
    time.sleep(t)

    try:
        member = driver.find_element(By.XPATH, '/html/body/div[1]/div/div/div/div[3]/div[1]/div/div[1]/section[1]/div/div/div[2]').text
    except:
        member = ""
    time.sleep(t)
    
    try:
        join = driver.find_element(By.XPATH, '/html/body/div[1]/div/div/div/div[3]/div[1]/div/div[1]/div[2]/div/div[2]/div/div[2]/a').get_attribute("href")
    except:
        join = ""
    time.sleep(t)

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
        "報名連結":join
    })
    print(num)
    num+=1

# 儲存為 CSV
df = pd.DataFrame(data)
df.to_csv("accupass_travel.csv", index=False, encoding="utf-8-sig")
print("已儲存 accupass_travel.csv")

# 關閉瀏覽器
driver.quit()

