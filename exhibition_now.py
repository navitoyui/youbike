# import packages
import requests
import time
from bs4 import BeautifulSoup
import csv


t = 0.1

rs = requests.session()
url_sort = 'https://artemperor.tw/tidbits?sort=1'#進行中的展期
url_page = '&page='

url = url_sort + url_page
print(url)

time.sleep(t)

page = 1
blocks = []
while True:
    res = rs.get(url + str(page))
    # print(url + str(page))

    soup = BeautifulSoup(res.text, "html.parser")

    blocks += soup.find_all("div", class_="list_text")
    time.sleep(t)
    
    block_T = soup.find("h3").get_text(strip=True)
    # print(block_T)

    if block_T == "":
        break
    
    print(f"抓第 {page} 頁，共 {len(blocks)} 筆")
    
    page += 1
    time.sleep(5)

# print(blocks)


data = []
num = 1
for block in blocks:
    try:
        link = block.a["href"]
        place = block.find("p").get_text(strip=True).split("｜")[1]
        time.sleep(t)

    except:
        continue

    #抓內文

    res_post = rs.get(link)
    time.sleep(t)
    post_soup = BeautifulSoup(res_post.text,"html.parser")

    #標題
    title = post_soup.find("div",class_="col_3_4 title_black").get_text(strip=True)
    time.sleep(t)

    #圖片連結
    img = post_soup.find("img",u="image")["src"]
    time.sleep(t)

    #展覽資訊
    info = post_soup.find("ul",class_="exb_info").find_all("li")
    time.sleep(t)

    for li in info:
        heading = li.find("h5").get_text(strip=True)
        time.sleep(t)

        p = li.find("p")
        time.sleep(t)

        if heading == "展期":
            date = p.get_text(strip=True).replace("日期：", "")
            time.sleep(t)

        elif heading == "地點":
            location = p.get_text(strip=True)
            time.sleep(t)


        elif heading == "相關連結":
            infolink = p.find("a").get("href")
            time.sleep(t)


        elif heading == "參展藝術家":
            member = p.get_text(strip=True)
            time.sleep(t)

    #展覽內文
    intro = post_soup.find("ul",class_="content").find('p')
    for br in intro.find_all("br"):
        br.replace_with("\n")
    article = intro.get_text(strip=True, separator='\n')

    data.append({
        "Link": link,
        "Place": place,
        "Title": title,
        "Image": img,
        "Date": date,
        "Location": location,
        "InfoLink": infolink,
        "Member": member,
        "Article": article
    })
    print(num)
    num+=1

# 寫入 CSV
with open("emperor_now.csv", "w", newline="", encoding="utf-8-sig") as f:
    fieldnames = ["Link", "Place", "Title", "Image", "Date", "Location", "InfoLink", "Member", "Article"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(data)
    print("CSV 檔案已完成輸出")
