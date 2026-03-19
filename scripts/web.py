"""
한국 주식시장 브리핑 스크립트 (web.py)
─────────────────────────────────────
AI Studio 등에서 독립 실행 가능한 시장 브리핑 생성기.
FinanceDataReader + 네이버 금융 스크래핑으로 데이터를 수집하고
깔끔한 마크다운 형식으로 출력합니다.

사용법:
    python web.py              # 전체 브리핑 출력
    python web.py --json       # JSON 형식 출력

필요 패키지:
    pip install FinanceDataReader requests beautifulsoup4
"""

import time
import re
import json
import sys
import io
import os
import math
from datetime import datetime, timedelta

# ── OpenAI ChatGPT 설정 ──
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = "gpt-4o-mini"

try:
    from openai import OpenAI as _OpenAI
    if OPENAI_API_KEY:
        _openai_client = _OpenAI(api_key=OPENAI_API_KEY)
        AI_AVAILABLE = True
    else:
        _openai_client = None
        AI_AVAILABLE = False
except ImportError:
    _openai_client = None
    AI_AVAILABLE = False

# ── Supabase 설정 (REST API 방식 — SDK 불필요) ──
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# Windows 환경 UTF-8 출력 보장
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr.encoding != "utf-8":
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
from typing import Dict, List, Any

# ═══════════════════════════════════════════════════════════════════
# 1. 시장 지수 수집 (FinanceDataReader)
# ═══════════════════════════════════════════════════════════════════

def get_market_indices() -> Dict[str, Any]:
    """KOSPI, KOSDAQ, USD/KRW, S&P500, NASDAQ 지수를 가져온다."""
    import FinanceDataReader as fdr

    start = (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d")
    today_str = datetime.now().strftime("%Y-%m-%d")
    indices = {}

    symbols = {
        "KOSPI":   "^KS11",
        "KOSDAQ":  "^KQ11",
        "USD/KRW": "USD/KRW",
        "S&P500":  "^GSPC",
        "NASDAQ":  "^IXIC",
    }

    for name, symbol in symbols.items():
        try:
            df = fdr.DataReader(symbol, start)
            if df.empty:
                indices[name] = {"close": None, "change": None, "change_pct": None}
                continue

            # FDR 장중 중복 행 처리: 같은 날짜에 NaN행 + 실제가 행이 2개 올 수 있음
            # 1) NaN 행 제거
            df = df.dropna(subset=["Close"])
            # 2) 같은 날짜 중복 시 마지막(최신) 행만 유지
            df = df[~df.index.duplicated(keep='last')]
            if df.empty:
                indices[name] = {"close": None, "change": None, "change_pct": None}
                continue

            close = float(df.iloc[-1]["Close"])
            if math.isnan(close):
                indices[name] = {"close": None, "change": None, "change_pct": None}
                continue

            latest_date = df.index[-1].strftime("%Y-%m-%d")
            is_today = (latest_date == today_str)

            if len(df) >= 2:
                prev = float(df.iloc[-2]["Close"])
                if math.isnan(prev) or prev == 0:
                    change, change_pct = 0, 0
                else:
                    change = round(close - prev, 2)
                    change_pct = round((close - prev) / prev * 100, 2)
            else:
                change, change_pct = 0, 0

            indices[name] = {
                "close": round(close, 2),
                "change": change,
                "change_pct": change_pct,
                "date": latest_date,
                "is_realtime": is_today,  # True = 장중 실시간, False = 전일 종가
            }
        except Exception as e:
            indices[name] = {"close": None, "change": None, "error": str(e)[:60]}

    return indices


# ═══════════════════════════════════════════════════════════════════
# 2. 네이버 금융 테마별 시세 스크래핑
# ═══════════════════════════════════════════════════════════════════

def _parse_naver_themes(page: int = 1) -> List[Dict[str, Any]]:
    """네이버 금융 테마별 시세 단일 페이지를 파싱한다."""
    import requests
    from bs4 import BeautifulSoup

    url = f"https://finance.naver.com/sise/theme.naver?&page={page}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": "https://finance.naver.com/sise/theme.naver",
    }

    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = "euc-kr"
        soup = BeautifulSoup(res.text, "html.parser")
    except Exception:
        return []

    themes = []
    table = soup.select_one("table.type_1")
    if not table:
        return []

    for row in table.select("tr"):
        cols = row.select("td")
        if len(cols) < 6:
            continue

        name_tag = cols[0].select_one("a")
        if not name_tag:
            continue
        theme_name = name_tag.get_text(strip=True)
        if not theme_name:
            continue

        href = name_tag.get("href", "")
        m = re.search(r"no=(\d+)", href)
        theme_no = m.group(1) if m else ""

        def _float(text):
            try:
                return float(text.replace(",", "").replace("%", ""))
            except (ValueError, TypeError):
                return 0.0

        def _int(text):
            try:
                return int(text.replace(",", "") or "0")
            except (ValueError, TypeError):
                return 0

        change_pct = _float(cols[1].get_text(strip=True))
        max_change_pct = _float(cols[2].get_text(strip=True))
        advancing = _int(cols[3].get_text(strip=True))
        unchanged = _int(cols[4].get_text(strip=True))
        declining = _int(cols[5].get_text(strip=True))
        total = advancing + unchanged + declining

        themes.append({
            "theme": theme_name,
            "theme_no": theme_no,
            "avg_change_pct": round(change_pct, 2),
            "max_change_pct": round(max_change_pct, 2),
            "advancing": advancing,
            "unchanged": unchanged,
            "declining": declining,
            "stock_count": total,
            "advance_ratio": round(advancing / max(total, 1) * 100, 1),
        })

    return themes


def _get_theme_top_stocks(theme_no: str) -> List[Dict[str, Any]]:
    """특정 테마의 전체 종목(상승률 기준)을 가져온다."""
    if not theme_no:
        return []

    import requests
    from bs4 import BeautifulSoup

    url = f"https://finance.naver.com/sise/sise_group_detail.naver?type=theme&no={theme_no}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": "https://finance.naver.com/sise/theme.naver",
    }

    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = "euc-kr"
        soup = BeautifulSoup(res.text, "html.parser")
    except Exception:
        return []

    stocks = []
    table = soup.select_one("table.type_5") or soup.select_one("table.type_1")
    if not table:
        return []

    for row in table.select("tr"):
        cols = row.select("td")
        if len(cols) < 5:
            continue

        # 종목명 추출 (col[0])
        name_tag = cols[0].select_one("a")
        if not name_tag:
            continue
        stock_name = name_tag.get_text(strip=True)
        if not stock_name or len(stock_name) < 2:
            continue

        href = name_tag.get("href", "")
        code_m = re.search(r"code=(\d+)", href)
        code = code_m.group(1) if code_m else ""

        # 현재가 추출 (col[2])
        price_text = cols[2].get_text(strip=True).replace(",", "") if len(cols) > 2 else "0"
        try:
            price = int(price_text)
        except (ValueError, TypeError):
            continue

        # 등락률 추출 (col[4])
        change_pct = 0.0
        if len(cols) > 4:
            pct_text = cols[4].get_text(strip=True).replace(",", "").replace("%", "").replace("+", "")
            try:
                change_pct = float(pct_text)
            except (ValueError, TypeError):
                change_pct = 0.0

        # 부호 확인 (col[3]의 이미지 또는 텍스트로 판단)
        if len(cols) > 3:
            change_text = cols[3].get_text(strip=True)
            sign_img = cols[3].select_one("img")
            if sign_img and "하락" in sign_img.get("alt", ""):
                change_pct = -abs(change_pct)
            elif "하락" in change_text or change_text.startswith("하락"):
                change_pct = -abs(change_pct)

        stocks.append({
            "name": stock_name, "code": code,
            "price": price, "change_pct": round(change_pct, 2),
        })

    stocks.sort(key=lambda x: x["change_pct"], reverse=True)
    return stocks


def get_theme_radar(top_n: int = 5) -> Dict[str, Any]:
    """테마 레이더: 상위 top_n개 테마 + 시장 요약을 반환한다."""
    all_themes = []
    for page in range(1, 6):
        pt = _parse_naver_themes(page)
        if not pt:
            break
        all_themes.extend(pt)
        if len(pt) < 20:
            break
        time.sleep(0.3)

    if not all_themes:
        return {"themes": [], "market_summary": {}, "error": "테마 데이터 수집 실패"}

    all_themes.sort(key=lambda x: x["avg_change_pct"], reverse=True)
    for i, t in enumerate(all_themes):
        t["rank"] = i + 1

    # 상위 테마에 대해 상세 종목 수집
    for t in all_themes[:top_n]:
        t["top_gainers"] = _get_theme_top_stocks(t.get("theme_no", ""))
        time.sleep(0.2)

    total = len(all_themes)
    up = len([t for t in all_themes if t["avg_change_pct"] > 0])
    down = len([t for t in all_themes if t["avg_change_pct"] < 0])

    return {
        "themes": all_themes[:top_n],
        "all_count": total,
        "market_summary": {
            "total_themes": total,
            "up_themes": up,
            "down_themes": down,
            "unchanged": total - up - down,
            "avg_change_pct": round(
                sum(t["avg_change_pct"] for t in all_themes) / max(total, 1), 2
            ),
        },
    }


# ═══════════════════════════════════════════════════════════════════
# 3. 시장 주요 뉴스 (네이버 금융 뉴스 + Google News RSS)
# ═══════════════════════════════════════════════════════════════════

def _fetch_naver_finance_news() -> List[Dict[str, str]]:
    """네이버 금융 뉴스 메인에서 최신 뉴스를 가져온다."""
    import requests
    from bs4 import BeautifulSoup

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
    }

    news = []
    seen = set()

    # 네이버 금융 시장 뉴스 페이지
    urls = [
        "https://finance.naver.com/news/mainnews.naver",
        "https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=258",
    ]

    for page_url in urls:
        try:
            res = requests.get(page_url, headers=headers, timeout=10)
            res.encoding = "euc-kr"
            soup = BeautifulSoup(res.text, "html.parser")

            # 뉴스 리스트 파싱 — 다양한 패턴
            for a_tag in soup.select("a[href*='article_id']"):
                # title 속성에 전체 제목이 있으면 우선 사용 (목록 페이지에서 잘리는 문제 방지)
                title = a_tag.get("title", "") or a_tag.get_text(strip=True)
                title = title.strip()
                if not title or len(title) < 8 or title in seen:
                    continue

                href = a_tag.get("href", "")
                if "article_id" not in href:
                    continue

                # 절대 URL 변환
                if href.startswith("/"):
                    href = "https://finance.naver.com" + href

                seen.add(title)
                news.append({
                    "title": title,
                    "source": "",
                    "date": "",
                    "summary": "",
                    "link": href,
                })

        except Exception:
            continue
        time.sleep(0.3)

    return news


def _fetch_google_news_rss() -> List[Dict[str, str]]:
    """Google News RSS에서 한국 증시 관련 뉴스를 가져온다."""
    import requests
    from bs4 import BeautifulSoup
    import xml.etree.ElementTree as ET

    news = []
    queries = ["코스피", "한국 증시", "코스닥", "한국 경제"]

    for query in queries:
        try:
            url = f"https://news.google.com/rss/search?q={query}&hl=ko&gl=KR&ceid=KR:ko"
            headers = {"User-Agent": "Mozilla/5.0"}
            res = requests.get(url, headers=headers, timeout=10)
            res.encoding = "utf-8"

            root = ET.fromstring(res.content)
            for item in root.findall(".//item"):
                title = item.find("title")
                link = item.find("link")
                pub_date = item.find("pubDate")
                source = item.find("source")

                if title is None or not title.text:
                    continue

                news.append({
                    "title": title.text.strip(),
                    "source": source.text.strip() if source is not None and source.text else "",
                    "date": pub_date.text.strip()[:22] if pub_date is not None and pub_date.text else "",
                    "summary": "",
                    "link": link.text.strip() if link is not None and link.text else "",
                })
        except Exception:
            continue
        time.sleep(0.3)

    return news


def _rank_news_with_ai(news_list: List[Dict[str, str]], top_n: int = 10) -> List[int]:
    """ChatGPT로 뉴스 중요도를 평가하고 상위 인덱스를 반환한다."""
    if not AI_AVAILABLE or not _openai_client or len(news_list) <= top_n:
        return list(range(min(len(news_list), top_n)))

    titles = "\n".join(f"{i}. {n['title']}" for i, n in enumerate(news_list))

    prompt = f"""아래는 오늘 수집된 한국 주식시장 관련 뉴스 목록입니다.
투자자에게 가장 중요하고 영향력 있는 뉴스 TOP {top_n}를 선정해주세요.

선정 기준:
- 시장 전체에 미치는 영향력 (지수 변동, 정책 변화, 글로벌 이벤트)
- 특정 섹터/종목에 대한 구체적 영향
- 투자 의사결정에 도움이 되는 정보 가치
- 단순 시세 나열이나 반복 뉴스는 낮은 순위

뉴스 목록:
{titles}

반드시 JSON 배열로만 응답하세요. 선정한 뉴스의 번호(0부터 시작)를 중요도 순으로 나열하세요.
예: [3, 7, 0, 12, 5, 8, 1, 15, 9, 2]"""

    try:
        response = _openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "반드시 JSON 배열만 응답하세요. 다른 텍스트 없이 숫자 배열만 출력하세요."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=200,
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        indices = json.loads(text)
        # 유효한 인덱스만 필터링
        valid = [i for i in indices if isinstance(i, int) and 0 <= i < len(news_list)]
        return valid[:top_n] if valid else list(range(min(len(news_list), top_n)))
    except Exception as e:
        print(f"⚠️ AI 뉴스 순위 선정 실패: {e}", flush=True)
        return list(range(min(len(news_list), top_n)))


def get_market_news(count: int = 10) -> List[Dict[str, str]]:
    """네이버 금융 + Google News RSS에서 뉴스를 전체 수집 후 AI가 중요도 TOP을 선정한다."""
    all_news = []
    seen_titles = set()

    # 1차: 네이버 금융 뉴스 (전체 수집)
    for n in _fetch_naver_finance_news():
        if n["title"] not in seen_titles:
            seen_titles.add(n["title"])
            all_news.append(n)

    # 2차: Google News RSS (전체 수집)
    for n in _fetch_google_news_rss():
        if n["title"] not in seen_titles:
            seen_titles.add(n["title"])
            all_news.append(n)

    print(f"   📥 총 {len(all_news)}건 수집 (네이버+구글) → AI 중요도 선별 중...", flush=True)

    # AI로 중요도 순위 선정
    ranked_indices = _rank_news_with_ai(all_news, top_n=count)
    return [all_news[i] for i in ranked_indices]


# ═══════════════════════════════════════════════════════════════════
# 4. 종합 관전 포인트 생성
# ═══════════════════════════════════════════════════════════════════

def generate_analysis(
    indices: Dict[str, Any],
    themes: Dict[str, Any],
    news: List[Dict[str, str]],
) -> List[str]:
    """수집된 데이터를 기반으로 종합 관전 포인트를 생성한다."""
    points = []
    ms = themes.get("market_summary", {})

    # ── 시장 심리 판단 ──
    total = ms.get("total_themes", 0)
    up = ms.get("up_themes", 0)
    down = ms.get("down_themes", 0)
    avg_chg = ms.get("avg_change_pct", 0)

    if total > 0:
        up_ratio = up / total * 100
        if up_ratio >= 90:
            points.append(
                f"📊 시장 전반 강세: 전체 {total}개 테마 중 {up}개 상승 "
                f"({up_ratio:.0f}%), 평균 {avg_chg:+.2f}% → 매우 낙관적 심리"
            )
        elif up_ratio >= 70:
            points.append(
                f"📊 시장 양호: 전체 {total}개 테마 중 {up}개 상승 "
                f"({up_ratio:.0f}%), 평균 {avg_chg:+.2f}%"
            )
        elif up_ratio >= 50:
            points.append(
                f"📊 시장 혼조: 상승 {up}개 vs 하락 {down}개, 평균 {avg_chg:+.2f}%"
            )
        else:
            points.append(
                f"📊 시장 약세: {down}개 테마 하락, 평균 {avg_chg:+.2f}% → 방어적 관점 필요"
            )

    # ── 주도 테마 분석 ──
    theme_list = themes.get("themes", [])
    if theme_list:
        top = theme_list[0]
        ai_related = [t for t in theme_list if any(
            kw in t["theme"] for kw in ["AI", "반도체", "HBM", "CXL", "온디바이스", "로봇"]
        )]
        if ai_related:
            names = ", ".join(t["theme"] for t in ai_related[:3])
            points.append(f"🤖 AI/반도체 테마 주도: {names} 등 상위권 포진")
        points.append(
            f"🔥 1위 테마 '{top['theme']}' → 평균 {top['avg_change_pct']:+.2f}%, "
            f"상승비율 {top['advance_ratio']}%"
        )

    # ── 지수별 판단 ──
    kospi = indices.get("KOSPI", {})
    kosdaq = indices.get("KOSDAQ", {})
    usd = indices.get("USD/KRW", {})
    sp500 = indices.get("S&P500", {})
    nasdaq = indices.get("NASDAQ", {})

    if kospi.get("close") and kospi.get("change_pct") is not None:
        direction = "상승" if kospi["change_pct"] > 0 else "하락" if kospi["change_pct"] < 0 else "보합"
        points.append(
            f"📈 KOSPI {kospi['close']:,.2f} ({kospi['change_pct']:+.2f}% {direction})"
        )

    if usd.get("close"):
        if usd["close"] >= 1400:
            points.append(
                f"💱 환율 부담: USD/KRW {usd['close']:,.2f}원 — "
                "고환율 지속으로 외국인 자금 유출 리스크 상존"
            )
        else:
            points.append(f"💱 환율 안정: USD/KRW {usd['close']:,.2f}원")

    if sp500.get("change_pct") is not None and nasdaq.get("change_pct") is not None:
        if sp500["change_pct"] < -1 or nasdaq["change_pct"] < -1:
            points.append(
                f"🇺🇸 미국 증시 약세: S&P500 {sp500['change_pct']:+.2f}%, "
                f"NASDAQ {nasdaq['change_pct']:+.2f}% → 국내 증시 하방 압력 가능"
            )
        elif sp500["change_pct"] > 1 or nasdaq["change_pct"] > 1:
            points.append(
                f"🇺🇸 미국 증시 강세: S&P500 {sp500['change_pct']:+.2f}%, "
                f"NASDAQ {nasdaq['change_pct']:+.2f}% → 국내 증시 상승 기대"
            )
        else:
            points.append(
                f"🇺🇸 미국 증시 혼조: S&P500 {sp500['change_pct']:+.2f}%, "
                f"NASDAQ {nasdaq['change_pct']:+.2f}%"
            )

    # ── 뉴스 키워드 분석 ──
    if news:
        all_titles = " ".join(n["title"] for n in news)
        keywords = {
            "유가/에너지": ["유가", "원유", "에너지", "WTI"],
            "전쟁/지정학": ["전쟁", "중동", "이란", "우크라이나", "지정학"],
            "금리/통화": ["금리", "기준금리", "연준", "Fed", "인하"],
            "AI/반도체": ["AI", "반도체", "하이닉스", "엔비디아", "HBM"],
        }
        for label, kws in keywords.items():
            if any(kw in all_titles for kw in kws):
                points.append(f"📰 뉴스 키워드 주목: [{label}] 관련 보도 다수 — 해당 섹터 변동성 주의")

    return points


def generate_news_signals(
    news: List[Dict[str, str]],
    indices: Dict[str, Any],
    themes: Dict[str, Any],
) -> List[str]:
    """뉴스 헤드라인을 분석하여 핵심 시그널을 생성한다 (규칙 기반)."""
    if not news:
        return []

    signals = []
    all_titles = " ".join(n["title"] for n in news)
    title_lower = all_titles.lower()

    # ── 시그널 규칙 정의 ──
    # (아이콘, 라벨, 키워드 그룹, 매칭시 시그널 메시지 생성 함수)
    signal_rules = [
        {
            "icon": "🚨",
            "label": "지정학 리스크",
            "keywords": ["전쟁", "중동", "이란", "우크라이나", "미사일", "제재", "군사", "NATO", "북한", "핵"],
            "matched_msg": lambda matched: (
                f"지정학 리스크 부각 — {', '.join(matched)} 관련 보도 감지. "
                "방산·에너지주 수혜, 수출주·항공주 압력 가능"
            ),
        },
        {
            "icon": "⛽",
            "label": "유가/원자재",
            "keywords": ["유가", "원유", "WTI", "브렌트", "OPEC", "배럴", "100달러", "에너지"],
            "matched_msg": lambda matched: (
                f"유가 변동 주목 — {', '.join(matched)} 키워드 감지. "
                "정유·화학·항공·운송 섹터 변동성 확대 예상"
            ),
        },
        {
            "icon": "🤖",
            "label": "AI/반도체",
            "keywords": ["AI", "반도체", "하이닉스", "엔비디아", "HBM", "삼성전자", "파운드리",
                         "GPU", "데이터센터", "온디바이스", "CXL", "TSMC"],
            "matched_msg": lambda matched: (
                f"AI/반도체 모멘텀 지속 — {', '.join(matched)} 관련 보도 다수. "
                "글로벌 AI 투자 확대 흐름에서 국내 반도체 밸류체인 수혜 기대"
            ),
        },
        {
            "icon": "💰",
            "label": "금리/통화정책",
            "keywords": ["금리", "기준금리", "연준", "Fed", "인하", "인상", "긴축", "완화",
                         "파월", "한은", "통화", "양적"],
            "matched_msg": lambda matched: (
                f"금리/통화정책 변동 — {', '.join(matched)} 키워드 감지. "
                "성장주·부동산·금융주 민감 반응 예상"
            ),
        },
        {
            "icon": "🌊",
            "label": "외국인/수급",
            "keywords": ["외국인", "외인", "기관", "순매수", "순매도", "수급", "자금유입",
                         "자금유출", "펀드"],
            "matched_msg": lambda matched: (
                f"수급 흐름 주목 — {', '.join(matched)} 관련 보도. "
                "외국인·기관 자금 흐름이 지수 방향성 결정 핵심"
            ),
        },
        {
            "icon": "⚡",
            "label": "원전/에너지전환",
            "keywords": ["원전", "원자력", "SMR", "전력", "태양광", "풍력", "신재생",
                         "수소", "전력기기"],
            "matched_msg": lambda matched: (
                f"에너지 전환 테마 — {', '.join(matched)} 관련 보도 감지. "
                "AI 데이터센터 전력 수요 확대로 원전·전력기기 지속 관심"
            ),
        },
        {
            "icon": "📋",
            "label": "정책/규제",
            "keywords": ["공매도", "금투세", "상장", "IPO", "공모", "규제", "정부", "정책",
                         "대통령", "국회", "법안"],
            "matched_msg": lambda matched: (
                f"정책·규제 변화 — {', '.join(matched)} 관련 보도. "
                "정책 수혜/피해 종목군 선별 필요"
            ),
        },
        {
            "icon": "📉",
            "label": "급락/위기",
            "keywords": ["급락", "폭락", "서킷브레이커", "사이드카", "패닉", "블랙먼데이",
                         "공포", "하한가"],
            "matched_msg": lambda matched: (
                f"시장 하락 리스크 — {', '.join(matched)} 키워드 감지. "
                "변동성 확대 구간, 현금 비중 확대 고려"
            ),
        },
        {
            "icon": "🚀",
            "label": "급등/랠리",
            "keywords": ["급등", "급반등", "랠리", "신고가", "최고치", "사이드카",
                         "줍줍", "저가매수"],
            "matched_msg": lambda matched: (
                f"시장 반등/랠리 — {', '.join(matched)} 키워드 감지. "
                "추격 매수 시 단기 과열 주의, 눌림목 대기 전략 유효"
            ),
        },
    ]

    for rule in signal_rules:
        matched = [kw for kw in rule["keywords"] if kw in all_titles]
        if matched:
            # 중복 키워드 최대 3개까지만 표시
            display_matched = list(dict.fromkeys(matched))[:3]
            msg = rule["matched_msg"](display_matched)
            signals.append(f"{rule['icon']} **[{rule['label']}]** {msg}")

    # ── 복합 시그널 (여러 조건이 동시에 성립할 때) ──
    kospi = indices.get("KOSPI", {})
    kospi_pct = kospi.get("change_pct", 0) or 0

    # 급등 + 전쟁 키워드 = 반등 시그널
    war_kw = any(kw in all_titles for kw in ["전쟁", "중동", "이란"])
    rally_kw = any(kw in all_titles for kw in ["반등", "급등", "수복", "종전"])
    if war_kw and rally_kw:
        signals.append(
            "🔄 **[복합 시그널]** 지정학 리스크 + 반등 키워드 동시 감지 → "
            "종전/완화 기대감에 따른 반등 구간. 변동성 양방향 주의"
        )

    # 코스피 대폭 변동
    if abs(kospi_pct) >= 3:
        direction = "급등" if kospi_pct > 0 else "급락"
        signals.append(
            f"⚠️ **[변동성 경고]** KOSPI {kospi_pct:+.2f}% {direction} — "
            f"일일 변동폭 ±3% 이상은 단기 과열/과매도 구간. 추세 전환점 주시"
        )

    if not signals:
        signals.append("ℹ️ 현재 뉴스에서 특별한 리스크/기회 시그널이 감지되지 않았습니다.")

    return signals


# ═══════════════════════════════════════════════════════════════════
# 4-2. ChatGPT AI 기반 종합 분석
# ═══════════════════════════════════════════════════════════════════

def _build_ai_data_text(indices, themes, news) -> str:
    """수집된 데이터를 AI 프롬프트용 텍스트로 변환한다."""
    parts = []

    # 지수 데이터
    parts.append("=== 시장 지수 ===")
    for name, data in indices.items():
        if isinstance(data, dict) and data.get("close"):
            chg = data.get("change_pct")
            parts.append(f"- {name}: {data['close']:,.2f} ({chg:+.2f}%)" if chg is not None else f"- {name}: {data['close']:,.2f}")

    # 테마 데이터
    parts.append("\n=== 상위 테마 ===")
    for t in themes.get("themes", [])[:5]:
        gainers = ", ".join(s["name"] for s in t.get("top_gainers", [])[:3])
        parts.append(f"- {t['rank']}위 {t['theme']}: 평균 {t['avg_change_pct']:+.2f}%, 상승비율 {t['advance_ratio']}% | 상위: {gainers}")

    ms = themes.get("market_summary", {})
    if ms:
        parts.append(f"- 전체 테마 {ms.get('total_themes',0)}개 중 상승 {ms.get('up_themes',0)}개, 하락 {ms.get('down_themes',0)}개")

    # 뉴스 데이터
    parts.append("\n=== 주요 뉴스 헤드라인 ===")
    for i, n in enumerate(news[:10], 1):
        parts.append(f"{i}. {n['title']}")

    return "\n".join(parts)


def generate_ai_analysis(indices, themes, news) -> dict:
    """
    OpenAI ChatGPT를 활용하여 종합 관전 포인트와 핵심 시그널을 생성한다.
    반환: {"analysis": [...], "signals": [...], "detailed_analysis": "..."}
    사용 불가 시 None 반환 → 규칙 기반 폴백.
    """
    if not AI_AVAILABLE or not _openai_client:
        return None

    data_text = _build_ai_data_text(indices, themes, news)

    system_msg = """당신은 한국 주식시장 전문 애널리스트입니다.
반드시 유효한 JSON만 응답하세요. 마크다운 코드블록이나 다른 텍스트는 포함하지 마세요."""

    user_msg = f"""아래는 오늘 한국 주식시장의 수집된 데이터입니다.

{data_text}

위 데이터를 바탕으로 다음 JSON 형식으로 응답해주세요:

{{
  "analysis": [
    "종합 관전 포인트 1",
    "종합 관전 포인트 2",
    "종합 관전 포인트 3",
    "종합 관전 포인트 4",
    "종합 관전 포인트 5"
  ],
  "signals": [
    "핵심 시그널 1",
    "핵심 시그널 2",
    "핵심 시그널 3",
    "핵심 시그널 4"
  ],
  "detailed_analysis": "마크다운 서술형 상세 분석 (아래 규칙 참고)"
}}

작성 규칙:
1. "analysis"는 5개 항목. 각 항목에 📊🔥📈💱🇺🇸🤖 등 이모지를 앞에 넣고, 실제 수치를 인용하며 **왜 중요한지 해석**까지 포함하세요.
2. "signals"는 3~5개 항목. 각 항목에 🚨⛽💰🌊📉 등 이모지와 **[카테고리]** 태그를 넣고, 구체적으로 어떤 업종/종목이 영향받는지 분석하세요.
3. "detailed_analysis"는 마크다운 형식의 서술형 상세 분석입니다. 다음 규칙을 따르세요:
   - 핵심 이슈 4~5개를 선정하세요.
   - 각 이슈는 "- **볼드 제목:** 상세 분석 내용" 형식으로 작성하세요.
   - 각 이슈별 3~5문장으로 깊이 있는 해석을 제공하세요.
   - 뉴스 데이터의 구체적 수치, 종목명, 이벤트를 반드시 인용하세요.
   - 해당 이슈가 시장에 미치는 영향과 관련 섹터/종목을 분석하세요.
   - 줄바꿈은 \n으로 표현하세요.
   예시:
   "- **중동 지정학적 리스크 장기화 및 원자재 공급망 불안:** 트럼프 대통령의 예상과 달리 미국-이란 전쟁이 장기화 조짐을 보이면서... 이는 변동성 장세 장기화의 주된 요인으로 작용하고 있습니다.\n\n- **반도체 슈퍼 사이클 및 AI 모멘텀 강화:** 메모리 반도체 슈퍼 사이클 진입 기대감과 AI 기술 발전이 맞물려..."
4. 단순 수치 나열이 아니라, 시장 참여자가 실제로 행동할 수 있는 인사이트를 제공하세요.
5. 한국어로 작성하세요.
"""

    try:
        response = _openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.7,
            max_tokens=4000,
        )
        text = response.choices[0].message.content.strip()

        # JSON 블록 추출 (```json ... ``` 형태 대응)
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        result = json.loads(text)
        analysis = result.get("analysis", [])
        signals = result.get("signals", [])
        detailed = result.get("detailed_analysis", "")

        if analysis and signals:
            return {"analysis": analysis, "signals": signals, "detailed_analysis": detailed}
        return None
    except Exception as e:
        print(f"⚠️ ChatGPT 분석 실패 (규칙 기반으로 대체): {e}", flush=True)
        return None


# ═══════════════════════════════════════════════════════════════════
# 5. 출력 포맷터
# ═══════════════════════════════════════════════════════════════════

def format_markdown(
    indices: Dict[str, Any],
    themes: Dict[str, Any],
    analysis: List[str],
    news: List[Dict[str, str]],
    news_signals: List[str] = None,
    detailed_analysis: str = "",
) -> str:
    """수집된 데이터를 마크다운 보고서로 변환한다."""
    now = datetime.now()
    lines = []

    lines.append(f"# 📊 한국 주식시장 브리핑 — {now.strftime('%Y년 %m월 %d일 (%a)')}\n")
    lines.append(f"> 생성 시각: {now.strftime('%H:%M KST')}\n")

    # 장 전(09:00 이전) 데이터 안내
    kospi_data = indices.get("KOSPI", {})
    if not kospi_data.get("is_realtime", True) and now.hour < 9:
        lines.append("> ⚠️ 장 개장 전 생성 — 지수는 **전일 종가** 기준입니다.\n")

    lines.append("---\n")

    # ── 시장 지수 ──
    lines.append("## 📈 시장 지수 현황\n")
    lines.append("| 지수 | 종가 | 전일 대비 | 등락률 |")
    lines.append("|------|------|-----------|--------|")

    for name in ["KOSPI", "KOSDAQ", "USD/KRW", "S&P500", "NASDAQ"]:
        data = indices.get(name, {})
        close = data.get("close")
        change = data.get("change")
        pct = data.get("change_pct")

        if close is None:
            lines.append(f"| {name} | N/A | N/A | N/A |")
            continue

        # 방향 이모지
        if pct and pct > 0:
            arrow = "🔴"
        elif pct and pct < 0:
            arrow = "🔵"
        else:
            arrow = "⚪"

        close_str = f"{close:,.2f}"
        change_str = f"{change:+,.2f}" if (change is not None and not math.isnan(change)) else "-"
        pct_str = f"{pct:+.2f}%" if (pct is not None and not math.isnan(pct)) else "-"

        lines.append(f"| {arrow} **{name}** | {close_str} | {change_str} | {pct_str} |")

    lines.append("")

    # ── 강세 테마 TOP 5 ──
    lines.append("---\n")
    lines.append("## 🔥 강세 테마 TOP 5\n")

    ms = themes.get("market_summary", {})
    if ms:
        lines.append(
            f"> 전체 {ms.get('total_themes',0)}개 테마 중 "
            f"상승 {ms.get('up_themes',0)}개 / 하락 {ms.get('down_themes',0)}개 "
            f"(평균 {ms.get('avg_change_pct',0):+.2f}%)\n"
        )

    theme_list = themes.get("themes", [])
    if theme_list:
        lines.append("| 순위 | 테마 | 평균등락 | 최대등락 | 상승비율 | 종목수 | 상위 종목 |")
        lines.append("|:----:|------|:--------:|:--------:|:--------:|:------:|-----------|")
        for t in theme_list:
            gainers = t.get("top_gainers", [])
            top_str = ", ".join(
                f"{s['name']}({s['change_pct']:+.1f}%)" for s in gainers[:3]
            ) if gainers else "-"
            lines.append(
                f"| {t['rank']} | **{t['theme']}** "
                f"| {t['avg_change_pct']:+.2f}% "
                f"| {t['max_change_pct']:+.2f}% "
                f"| {t['advance_ratio']}% "
                f"| {t['stock_count']} "
                f"| {top_str} |"
            )
    else:
        lines.append("테마 데이터를 가져올 수 없습니다.\n")

    lines.append("")

    # ── 매크로 이슈 & 핵심 분석 (서술형) ──
    if detailed_analysis:
        lines.append("---\n")
        lines.append("## 📋 매크로 이슈 & 핵심 분석\n")
        # ChatGPT가 HTML 태그나 리터럴 \n을 반환하는 경우 정리
        cleaned = detailed_analysis
        cleaned = cleaned.replace("<br><br>", "\n\n")
        cleaned = cleaned.replace("<br>", "\n")
        cleaned = cleaned.replace("\\n\\n", "\n\n")
        cleaned = cleaned.replace("\\n", "\n")
        lines.append(cleaned)
        lines.append("")

    # ── 종합 관전 포인트 ──
    lines.append("---\n")
    lines.append("## 🔍 종합 관전 포인트\n")
    for i, point in enumerate(analysis, 1):
        lines.append(f"{i}. {point}")
    lines.append("")

    # ── 시장 주요 뉴스 ──
    lines.append("---\n")
    lines.append(f"## 📰 시장 주요 뉴스 TOP {len(news)}\n")

    if news:
        for i, n in enumerate(news, 1):
            src = f" — {n['source']}" if n.get("source") else ""
            date = f" ({n['date']})" if n.get("date") else ""
            lines.append(f"**{i}.** [{n['title']}]({n.get('link','')}){src}{date}")
            if n.get("summary"):
                lines.append(f"   > {n['summary']}")
            lines.append("")
    else:
        lines.append("뉴스 데이터를 가져올 수 없습니다.\n")

    # ── 뉴스에서 읽는 핵심 시그널 ──
    if news_signals:
        lines.append("---\n")
        lines.append("## 🔑 뉴스에서 읽는 핵심 시그널\n")
        for i, sig in enumerate(news_signals, 1):
            lines.append(f"{i}. {sig}")
        lines.append("")

    # ── 면책 ──
    lines.append("---\n")
    lines.append(
        "> ⚠️ 본 브리핑은 자동 수집·분석 결과이며 투자 권유가 아닙니다. "
        "투자 결정은 본인의 판단과 책임하에 이루어져야 합니다."
    )
    lines.append(
        f"\n*데이터 소스: FinanceDataReader, 네이버 금융 테마별 시세, 네이버 뉴스*  \n"
        f"*생성 시각: {now.strftime('%Y-%m-%d %H:%M KST')}*"
    )

    # ── 테마별 종목 데이터 (프론트엔드 팝업용, HTML 코멘트로 숨김) ──
    if theme_list:
        theme_stocks_data = {}
        for t in theme_list:
            gainers = t.get("top_gainers", [])
            theme_stocks_data[t["theme"]] = {
                "theme_no": t.get("theme_no", ""),
                "avg_change_pct": t["avg_change_pct"],
                "stock_count": t["stock_count"],
                "stocks": gainers,
            }
        lines.append(f"\n<!-- THEME_STOCKS_DATA:{json.dumps(theme_stocks_data, ensure_ascii=False)} -->")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════
# 6. 메인 실행
# ═══════════════════════════════════════════════════════════════════

def run_briefing(output_json: bool = False) -> str:
    """전체 브리핑을 실행하고 결과를 반환한다."""
    print("⏳ 시장 지수 수집 중...", flush=True)
    indices = get_market_indices()

    print("⏳ 테마 레이더 수집 중 (네이버 금융)...", flush=True)
    themes = get_theme_radar(top_n=5)

    print("⏳ 시장 뉴스 수집 중...", flush=True)
    news = get_market_news(count=10)

    print("⏳ 종합 분석 생성 중...", flush=True)

    # ChatGPT AI 분석 우선 시도, 실패 시 규칙 기반 폴백
    ai_result = None
    if AI_AVAILABLE:
        print("🤖 ChatGPT AI 분석 중...", flush=True)
        ai_result = generate_ai_analysis(indices, themes, news)

    if ai_result:
        analysis = ai_result["analysis"]
        news_signals = ai_result["signals"]
        detailed_analysis = ai_result.get("detailed_analysis", "")
        print("✅ ChatGPT AI 분석 완료!", flush=True)
    else:
        if AI_AVAILABLE:
            print("⚠️ ChatGPT 실패 → 규칙 기반 분석으로 대체", flush=True)
        else:
            print("ℹ️ OpenAI API 키 미설정 → 규칙 기반 분석 사용", flush=True)
        analysis = generate_analysis(indices, themes, news)
        news_signals = generate_news_signals(news, indices, themes)
        detailed_analysis = ""

    if output_json:
        result = {
            "generated_at": datetime.now().isoformat(),
            "indices": indices,
            "themes": themes,
            "analysis": analysis,
            "news": news,
            "news_signals": news_signals,
        }
        return json.dumps(result, ensure_ascii=False, indent=2)
    else:
        return format_markdown(indices, themes, analysis, news, news_signals, detailed_analysis)


def check_duplicate_post() -> bool:
    """최근 40분 내 이미 포스팅된 브리핑이 있는지 확인한다.
    이중 cron(정시 + 30분 백업)으로 인한 중복 발행 방지.
    Returns: True면 중복 → 스킵해야 함.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False

    import requests as req

    cutoff = (datetime.now() - timedelta(minutes=40)).isoformat()
    url = (
        f"{SUPABASE_URL}/rest/v1/market_posts"
        f"?created_at=gte.{cutoff}"
        f"&select=id,created_at"
        f"&limit=1"
    )
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    try:
        res = req.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            if data:
                print(f"⏭️ 최근 40분 내 포스트 발견 (ID: {data[0]['id']}) → 중복 발행 스킵", flush=True)
                return True
        return False
    except Exception as e:
        print(f"⚠️ 중복 체크 실패 (계속 진행): {e}", flush=True)
        return False


def publish_to_supabase(title: str, content: str) -> dict:
    """생성된 브리핑을 Supabase market_posts 테이블에 저장한다 (REST API 방식)."""
    import requests as req

    url = f"{SUPABASE_URL}/rest/v1/market_posts"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    payload = {"title": title, "content": content}

    try:
        res = req.post(url, json=payload, headers=headers, timeout=15)
        if res.status_code == 201:
            data = res.json()
            if data:
                post = data[0]
                return {
                    "success": True,
                    "id": post.get("id"),
                    "title": post.get("title"),
                    "created_at": post.get("created_at"),
                }
            return {"error": "데이터 삽입 성공했으나 응답 데이터 없음"}
        else:
            return {"error": f"HTTP {res.status_code}: {res.text[:200]}"}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    output_json = "--json" in sys.argv
    no_publish = "--no-publish" in sys.argv

    # ── 중복 발행 체크 (정시+30분 이중 cron 보호) ──
    if not no_publish and not output_json:
        if check_duplicate_post():
            print("✅ 이미 최근 발행된 브리핑이 있습니다. 정상 종료합니다.")
            sys.exit(0)

    result = run_briefing(output_json=output_json)
    print("\n" + "=" * 60)
    print(result)

    # ── Supabase 자동 포스팅 ──
    if not no_publish and not output_json:
        print("\n⏳ Supabase에 브리핑 포스팅 중...", flush=True)
        now = datetime.now()
        title = f"한국 주식시장 브리핑 — {now.strftime('%Y년 %m월 %d일 (%a) %H:%M')}"
        pub_result = publish_to_supabase(title, result)
        if pub_result.get("success"):
            print(f"✅ 포스팅 완료! (ID: {pub_result['id']})")
        else:
            print(f"❌ 포스팅 실패: {pub_result.get('error')}")
    elif no_publish:
        print("\nℹ️ --no-publish 플래그로 Supabase 포스팅을 건너뛰었습니다.")
