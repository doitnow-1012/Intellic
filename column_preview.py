"""HTML 프리뷰 생성 모듈 — Intellic 웹 프로젝트용.

이 파일은 독립 모듈로, Intellic 프로젝트에 복사하여 사용합니다.
딥리서치 리포트 데이터를 받아 SEO 최적화된 HTML 페이지를 생성합니다.

사용법:
    from column.column_preview import generate_html_preview
    html_path = generate_html_preview(report_dict, image_urls_list)
"""
from __future__ import annotations

import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

KST = timezone(timedelta(hours=9))


def generate_html_preview(
    report: dict,
    image_urls: list[dict],
    output_path: str | Path | None = None,
) -> str:
    """SEO 최적화된 HTML 프리뷰 생성.

    Args:
        report: 요약 에이전트 결과 dict
            {title, summary, content_md, category, tags, meta_description, slug}
        image_urls: 업로드된 이미지 URL 목록
            [{"placeholder": "...", "url": "...", "prompt": "..."}, ...]
        output_path: HTML 저장 경로 (None이면 기본 경로)

    Returns:
        저장된 HTML 파일의 절대 경로
    """
    title = report.get("title", "제목 없음")
    summary = report.get("summary", "")
    content_md = report.get("content_md", "")
    category = report.get("category", "")
    tags = report.get("tags", [])
    meta_desc = report.get("meta_description", summary[:160])
    now = datetime.now(KST).strftime("%Y년 %m월 %d일")

    # 본문에 이미지 URL 삽입
    for img in image_urls:
        placeholder = f"[{img['placeholder']}]"
        prompt_text = img.get("prompt", "image")[:80]
        caption_text = img.get("prompt", "")[:100]
        html_img = (
            f'<figure>'
            f'<img src="{img["url"]}" alt="{prompt_text}" loading="lazy" />'
            f'<figcaption>{caption_text}</figcaption>'
            f'</figure>'
        )
        content_md = content_md.replace(placeholder, html_img)

    # 마크다운 → HTML 변환
    content_html = _md_to_html(content_md)

    cover_img = image_urls[0]["url"] if image_urls else ""
    tags_html = " ".join(f'<span class="tag">{t}</span>' for t in tags)

    html = _build_html_template(
        title=title,
        summary=summary,
        category=category,
        tags_html=tags_html,
        meta_desc=meta_desc,
        cover_img=cover_img,
        content_html=content_html,
        date_str=now,
    )

    # 파일 저장
    if output_path is None:
        output_path = Path(__file__).resolve().parent / "_preview.html"
    else:
        output_path = Path(output_path)

    output_path.write_text(html, encoding="utf-8")
    return str(output_path)


def _md_to_html(md: str) -> str:
    """간단한 마크다운 → HTML 변환."""
    html = md
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"^- (.+)$", r"<li>\1</li>", html, flags=re.MULTILINE)
    html = re.sub(r"(<li>.*?</li>\n?)+", r"<ul>\g<0></ul>", html)
    html = html.replace("\n\n", "</p><p>")
    html = f"<p>{html}</p>"
    return html


def _build_html_template(
    title: str,
    summary: str,
    category: str,
    tags_html: str,
    meta_desc: str,
    cover_img: str,
    content_html: str,
    date_str: str,
) -> str:
    """HTML 템플릿 생성."""
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{meta_desc}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{meta_desc}">
    <meta property="og:image" content="{cover_img}">
    <meta property="og:type" content="article">
    <title>{title} | Intellic</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg: #0a0a0f;
            --surface: #12121a;
            --card: #1a1a2e;
            --border: #2a2a3e;
            --text: #e4e4ed;
            --text-secondary: #9999aa;
            --accent: #6c5ce7;
            --accent-glow: rgba(108, 92, 231, 0.3);
            --gradient-1: linear-gradient(135deg, #6c5ce7, #a855f7);
            --gradient-2: linear-gradient(135deg, #0ea5e9, #6c5ce7);
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Noto Sans KR', -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.8;
            font-size: 16px;
        }}
        .hero {{
            position: relative;
            padding: 80px 20px 60px;
            text-align: center;
            background: linear-gradient(180deg, #1a1a2e 0%, var(--bg) 100%);
            overflow: hidden;
        }}
        .hero::before {{
            content: '';
            position: absolute;
            top: -50%; left: -50%;
            width: 200%; height: 200%;
            background: radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 60%);
            animation: pulse 4s ease-in-out infinite;
        }}
        @keyframes pulse {{
            0%, 100% {{ opacity: 0.3; transform: scale(1); }}
            50% {{ opacity: 0.6; transform: scale(1.05); }}
        }}
        .hero-content {{ position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }}
        .category {{
            display: inline-block; padding: 4px 16px; border-radius: 20px;
            background: var(--gradient-1); font-size: 13px; font-weight: 500;
            letter-spacing: 0.5px; margin-bottom: 20px;
        }}
        h1 {{
            font-size: clamp(28px, 4vw, 42px); font-weight: 700; line-height: 1.3;
            margin-bottom: 20px; background: var(--gradient-2);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }}
        .summary {{ font-size: 18px; color: var(--text-secondary); max-width: 600px; margin: 0 auto 24px; }}
        .meta {{
            font-size: 14px; color: var(--text-secondary);
            display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
        }}
        .tags {{ margin-top: 16px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }}
        .tag {{
            padding: 4px 12px; border-radius: 12px; background: var(--card);
            border: 1px solid var(--border); font-size: 13px; color: var(--accent);
        }}
        .article {{ max-width: 760px; margin: 0 auto; padding: 40px 20px 80px; }}
        .article h2 {{
            font-size: 24px; font-weight: 700; margin: 48px 0 16px;
            padding-left: 16px; border-left: 3px solid var(--accent); color: #fff;
        }}
        .article h3 {{ font-size: 20px; font-weight: 500; margin: 32px 0 12px; color: #ddd; }}
        .article p {{ margin-bottom: 16px; color: var(--text); }}
        .article strong {{ color: #fff; font-weight: 500; }}
        .article ul {{ margin: 12px 0 20px 24px; list-style: none; }}
        .article li {{ position: relative; padding-left: 20px; margin-bottom: 8px; }}
        .article li::before {{ content: '▸'; position: absolute; left: 0; color: var(--accent); }}
        figure {{
            margin: 32px 0; border-radius: 12px; overflow: hidden;
            border: 1px solid var(--border); background: var(--card);
        }}
        figure img {{ width: 100%; height: auto; display: block; }}
        figcaption {{
            padding: 12px 16px; font-size: 13px; color: var(--text-secondary); text-align: center;
        }}
        .footer {{
            text-align: center; padding: 40px;
            border-top: 1px solid var(--border); color: var(--text-secondary); font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="hero">
        <div class="hero-content">
            <span class="category">{category}</span>
            <h1>{title}</h1>
            <p class="summary">{summary}</p>
            <div class="meta">
                <span>📅 {date_str}</span>
                <span>📖 Gemini Deep Research</span>
                <span>🤖 AI Generated Column</span>
            </div>
            <div class="tags">{tags_html}</div>
        </div>
    </div>
    <article class="article">
        {content_html}
    </article>
    <div class="footer">
        <p>Intellic — AI Research Column | Powered by Gemini 2.5 Flash + Imagen 4</p>
    </div>
</body>
</html>"""
