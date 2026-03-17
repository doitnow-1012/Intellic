import requests
from bs4 import BeautifulSoup
import re

url = "https://finance.naver.com/sise/sise_group_detail.naver?type=theme&no=36"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://finance.naver.com/sise/theme.naver",
}

res = requests.get(url, headers=headers, timeout=10)
res.encoding = "euc-kr"
soup = BeautifulSoup(res.text, "html.parser")

table = soup.select_one("table.type_5") or soup.select_one("table.type_1")
print(f"table found: {table is not None}")

if table:
    rows = table.select("tr")
    print(f"rows: {len(rows)}")
    for i, row in enumerate(rows[:15]):
        cols = row.select("td")
        if len(cols) < 6:
            continue
        name_tag = (
            cols[0].select_one("a.name_area")
            or cols[0].select_one("div.name_area a")
            or cols[0].select_one("a[href*='main.naver?code=']")
            or cols[0].select_one("a")
        )
        if name_tag:
            print(f"Row {i}: name={name_tag.get_text(strip=True)}, cols_len={len(cols)}")
            for ci, c in enumerate(cols):
                print(f"  col[{ci}]: {c.get_text(strip=True)[:50]}")
else:
    all_tables = soup.select("table")
    print(f"Total tables: {len(all_tables)}")
    for i, t in enumerate(all_tables):
        cls = t.get("class", [])
        print(f"  table[{i}]: class={cls}, rows={len(t.select('tr'))}")
