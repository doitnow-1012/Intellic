/**
 * 네이버 증권 리서치 리포트 스크래핑 + Gemini AI 요약
 * Intellic stock_report 모듈 핵심 로직
 */

import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';

// ============================================================
// Types
// ============================================================

export interface ResearchReport {
  title: string;
  firm: string;
  date: string;
  targetPrice: string;
  opinion: string;
  url: string;
  attachUrl?: string;
  summary?: string;
}

export interface StockReportResult {
  stockName: string;
  stockCode: string;
  month: string;
  reports: ResearchReport[];
  overallSummary: string;
}

// ============================================================
// 1) 리포트 목록 가져오기
// ============================================================

/**
 * 네이버 증권 리서치 페이지에서 리포트 목록을 가져옵니다.
 * 1차: stock.naver.com JSON API (풍부한 데이터: 목표주가, 투자의견, 요약)
 * 2차: finance.naver.com HTML 파싱 (폴백)
 */
export async function fetchReportList(stockCode: string): Promise<ResearchReport[]> {
  // 1차: 새 네이버 증권 JSON API
  try {
    const reports = await fetchFromNaverStockAPI(stockCode);
    if (reports.length > 0) {
      console.log(`[stock-report] Fetched ${reports.length} reports from stock.naver.com API for ${stockCode}`);
      return reports;
    }
  } catch (e) {
    console.warn('[stock-report] Naver Stock API failed:', e);
  }

  // 2차: 구버전 네이버 금융 HTML 파싱 (폴백)
  try {
    const reports = await fetchFromNaverFinanceLegacy(stockCode);
    if (reports.length > 0) {
      console.log(`[stock-report] Fetched ${reports.length} reports from legacy finance.naver.com for ${stockCode}`);
      return reports;
    }
  } catch (e) {
    console.warn('[stock-report] Legacy Naver Finance also failed:', e);
  }

  console.warn('[stock-report] No reports found from any source');
  return [];
}

/**
 * 새 네이버 증권 JSON API
 * URL: https://stock.naver.com/api/domestic/research/{종목코드}/research?page=0&size=20
 * 반환: title, content(요약), writeDate, brokerName, goalPrice, opinion, attachUrl
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFromNaverStockAPI(stockCode: string): Promise<ResearchReport[]> {
  const url = `https://stock.naver.com/api/domestic/research/${stockCode}/research?page=0&size=20`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Referer': `https://stock.naver.com/domestic/stock/${stockCode}/research`,
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();

  // API 응답 구조: { researchList: [...], totalCount, ... } 또는 배열 직접 반환
  const items: any[] = data.researchList || data.items || data.content || (Array.isArray(data) ? data : []);

  if (!items || items.length === 0) {
    // 다른 키에 데이터가 있을 수 있으므로 재귀 탐색
    const found = findArrayInObject(data);
    if (!found || found.length === 0) return [];
    return mapApiItems(found, stockCode);
  }

  return mapApiItems(items, stockCode);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiItems(items: any[], stockCode: string): ResearchReport[] {
  return items
    .filter((item: any) => item.title || item.reportTitle)
    .map((item: any) => {
      // 날짜 포맷
      const writeDate = item.writeDate || item.date || item.created_at || '';

      // 목표주가
      const goalPrice = item.goalPrice || item.targetPrice || item.target_price;
      const targetPriceStr = goalPrice
        ? `${Number(goalPrice).toLocaleString()}원`
        : '-';

      // 투자의견
      const opinion = item.opinion || item.investmentOpinion || '-';

      // 요약 (HTML 태그 제거)
      const rawContent = item.content || item.summary || item.body || '';
      const cleanContent = rawContent.replace(/<[^>]*>/g, '').trim();

      // nid 추출
      const nid = item.nid || item.id || item.researchId || '';
      const reportUrl = nid
        ? `https://stock.naver.com/domestic/stock/${stockCode}/research/${nid}`
        : '';

      return {
        title: item.title || item.reportTitle || '',
        firm: item.brokerName || item.broker || item.firm || '',
        date: writeDate,
        targetPrice: targetPriceStr,
        opinion,
        url: reportUrl,
        attachUrl: item.attachUrl || '',
        summary: cleanContent || undefined,
      };
    });
}

/**
 * JSON 객체에서 리서치 배열을 재귀적으로 탐색
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findArrayInObject(obj: any): any[] | null {
  if (!obj || typeof obj !== 'object') return null;

  if (Array.isArray(obj)) {
    if (obj.length > 0 && (obj[0]?.title || obj[0]?.reportTitle)) {
      return obj;
    }
  }

  for (const key of Object.keys(obj)) {
    const result = findArrayInObject(obj[key]);
    if (result) return result;
  }

  return null;
}

/**
 * 구버전 네이버 금융 리서치 페이지 스크래핑 (폴백)
 * EUC-KR 인코딩, 제목/증권사/날짜만 추출 가능
 */
async function fetchFromNaverFinanceLegacy(stockCode: string): Promise<ResearchReport[]> {
  const url = `https://finance.naver.com/research/company_list.naver?searchType=itemCode&itemCode=${stockCode}&page=1`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buffer = await res.arrayBuffer();
  const decoder = new TextDecoder('euc-kr');
  const html = decoder.decode(buffer);
  const $ = cheerio.load(html);

  const reports: ResearchReport[] = [];

  $('table.type_1 tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 5) return;

    const titleCell = cells.eq(1);
    const linkEl = titleCell.find('a');
    const title = linkEl.text().trim();
    const href = linkEl.attr('href') || '';

    if (!title) return;

    let reportUrl = '';
    if (href) {
      const nidMatch = href.match(/nid=(\d+)/);
      if (nidMatch) {
        reportUrl = `https://stock.naver.com/domestic/stock/${stockCode}/research/${nidMatch[1]}`;
      }
    }

    const firm = cells.eq(2).text().trim();
    const date = cells.eq(4).text().trim();

    if (title && firm && date) {
      reports.push({
        title,
        firm,
        date,
        targetPrice: '-',
        opinion: '-',
        url: reportUrl,
      });
    }
  });

  return reports;
}

// ============================================================
// 2) PDF 1페이지 전체 텍스트 추출
// ============================================================

/**
 * attachUrl(PDF 직접 다운로드 링크)에서 PDF를 다운로드하고
 * pdfjs-dist로 1페이지 전체 텍스트를 추출합니다.
 */
export async function fetchPdfFirstPageText(attachUrl: string): Promise<string> {
  if (!attachUrl) return '';

  try {
    // PDF 다운로드
    const res = await fetch(attachUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://stock.naver.com/',
      },
    });

    if (!res.ok) {
      console.warn(`[stock-report] PDF download failed: HTTP ${res.status}`);
      return '';
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    // pdfjs-dist로 1페이지 텍스트 추출 (worker 비활성화)
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      disableAutoFetch: true,
      isEvalSupported: false,
      useSystemFonts: false,
    });
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');

    console.log(`[stock-report] PDF 1페이지 추출 완료: ${text.length}글자`);
    return text;
  } catch (e) {
    console.warn('[stock-report] PDF 텍스트 추출 실패:', e);
    return '';
  }
}

// ============================================================
// 3) Gemini AI 요약
// ============================================================

/**
 * Gemini AI를 사용하여 리서치 리포트들을 종합 요약합니다.
 */
export async function summarizeReportsWithAI(
  stockName: string,
  stockCode: string,
  month: string,
  reports: ResearchReport[]
): Promise<{ reports: ResearchReport[]; overallSummary: string }> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[stock-report] No GOOGLE_API_KEY found, skipping AI summary');
    return {
      reports,
      overallSummary: '> ⚠️ AI 요약을 위해 `.env.local`에 `GOOGLE_API_KEY`를 설정해주세요.',
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  // 리포트 목록 텍스트 구성
  const reportsText = reports
    .map(
      (r, i) =>
        `[리포트 ${i + 1}]\n` +
        `- 제목: ${r.title}\n` +
        `- 증권사: ${r.firm}\n` +
        `- 날짜: ${r.date}\n` +
        `- 목표주가: ${r.targetPrice}\n` +
        `- 투자의견: ${r.opinion}\n` +
        (r.summary ? `- 추출된 내용: ${r.summary}\n` : '')
    )
    .join('\n');

  const prompt = `당신은 한국 주식 시장의 전문 애널리스트입니다.
아래는 ${stockName}(${stockCode})의 ${month} 증권사 리서치 리포트 목록입니다.

${reportsText}

위 리포트들을 분석하여 다음 형식으로 종합 요약을 작성해주세요:

## 📊 ${month} 증권사 리포트 종합 분석

### 컨센서스 요약
- 투자의견 분포 (매수/중립/매도 비율)
- 목표주가 범위 (최저~최고, 평균)
- 주요 공통 키워드/테마

### 핵심 이슈
각 리포트에서 언급된 핵심 이슈들을 3~5개로 정리

### 투자 시사점
리포트들을 종합한 투자 시사점을 3~4문장으로 작성

마크다운 형식으로 작성하고, 구체적인 수치를 반드시 포함하세요.
제공된 데이터에 기반해서만 작성하고, 없는 내용을 만들지 마세요.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    return { reports, overallSummary: text };
  } catch (e) {
    console.error('[stock-report] Gemini API error:', e);
    return {
      reports,
      overallSummary: `> ⚠️ AI 요약 생성 중 오류가 발생했습니다: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ============================================================
// 4) 메인 파이프라인
// ============================================================

/**
 * 종목코드와 종목명으로 해당 월의 리포트를 가져오고 AI 요약을 생성합니다.
 */
export async function generateStockReport(
  stockCode: string,
  stockName: string,
  targetYear?: number,
  targetMonth?: number
): Promise<StockReportResult> {
  const now = new Date();
  const year = targetYear || now.getFullYear();
  const month = targetMonth || now.getMonth() + 1;
  const monthLabel = `${year}년 ${month}월`;

  // 1. 리포트 목록 가져오기
  let allReports = await fetchReportList(stockCode);

  // 2. 해당 월 리포트만 필터링
  // 네이버 금융 날짜 형식 예: "26.03.13" (2자리 연도)
  const shortYear = String(year).slice(-2); // "26"
  const monthPad = String(month).padStart(2, '0'); // "03"

  const patterns = [
    `${year}.${monthPad}`,      // 2026.03
    `${year}-${monthPad}`,      // 2026-03
    `${year}/${monthPad}`,      // 2026/03
    `${shortYear}.${monthPad}`, // 26.03
    `${shortYear}-${monthPad}`, // 26-03
    `${shortYear}/${monthPad}`, // 26/03
  ];

  const filteredReports = allReports.filter((r) => {
    const d = r.date.replace(/\s/g, '');
    return patterns.some((p) => d.startsWith(p));
  });

  // === 이번 달 리포트가 0건인 경우: 컨센서스 + 뉴스 기반 분석 ===
  if (filteredReports.length === 0) {
    console.log(`[stock-report] ${monthLabel} 리포트 0건 — 컨센서스+뉴스 기반 분석으로 전환`);

    const [consensus, news] = await Promise.all([
      fetchConsensus(stockCode),
      fetchStockNews(stockCode),
    ]);

    // 직전 리포트들도 참고 자료로 포함 (최대 5건)
    const recentReports = allReports.slice(0, 5);

    const overallSummary = await generateFallbackAnalysis(
      stockName, stockCode, monthLabel, consensus, news, recentReports
    );

    return {
      stockName,
      stockCode,
      month: monthLabel,
      reports: [],
      overallSummary,
    };
  }

  // 3. 각 리포트의 PDF 1페이지 텍스트 추출 (최대 5개까지만, 과부하 방지)
  const reportsWithText = await Promise.all(
    filteredReports.slice(0, 5).map(async (report, i) => {
      // 요청 간격 제한 (1초 딜레이)
      if (i > 0) await sleep(1000);
      const pdfText = report.attachUrl
        ? await fetchPdfFirstPageText(report.attachUrl)
        : '';
      return { ...report, summary: pdfText || report.summary || undefined };
    })
  );

  // 4. Gemini AI 종합 요약 생성
  const { reports: summarizedReports, overallSummary } = await summarizeReportsWithAI(
    stockName,
    stockCode,
    monthLabel,
    reportsWithText
  );

  return {
    stockName,
    stockCode,
    month: monthLabel,
    reports: summarizedReports,
    overallSummary,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// 5) 컨센서스 & 뉴스 수집
// ============================================================

interface ConsensusData {
  opinion: string;       // 투자의견 점수 (5: 적극매수, 4: 매수, 3: 중립)
  targetPrice: string;   // 컨센서스 목표주가
  date: string;          // 기준일
}

interface NewsItem {
  title: string;
  body: string;
  officeName: string;
  datetime: string;
}

/**
 * 네이버 증권 컨센서스 데이터 (투자의견, 목표주가)
 */
async function fetchConsensus(stockCode: string): Promise<ConsensusData | null> {
  try {
    const res = await fetch(
      `https://stock.naver.com/api/domestic/detail/${stockCode}/consensus`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': `https://stock.naver.com/domestic/stock/${stockCode}/total`,
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      opinion: data.opinion || '',
      targetPrice: data.targetPrice || '',
      date: data.date || '',
    };
  } catch (e) {
    console.warn('[stock-report] 컨센서스 조회 실패:', e);
    return null;
  }
}

/**
 * 네이버 증권 최신 뉴스 (최대 10건)
 */
async function fetchStockNews(stockCode: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://stock.naver.com/api/domestic/detail/news?itemCode=${stockCode}&page=1&pageSize=10`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': `https://stock.naver.com/domestic/stock/${stockCode}/total`,
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();

    // 클러스터 구조에서 뉴스 아이템 추출
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: NewsItem[] = [];
    const clusters = data.clusters || data.items || [];
    for (const cluster of clusters) {
      const clusterItems = cluster.items || [];
      for (const item of clusterItems) {
        items.push({
          title: item.title || '',
          body: item.body || '',
          officeName: item.officeName || '',
          datetime: item.datetime || '',
        });
      }
      if (items.length >= 10) break;
    }
    return items.slice(0, 10);
  } catch (e) {
    console.warn('[stock-report] 뉴스 조회 실패:', e);
    return [];
  }
}

// ============================================================
// 6) 폴백 분석 (리포트 0건 시)
// ============================================================

/**
 * 이번 달 리포트가 없을 때 컨센서스+뉴스+직전 리포트로 종합 분석 생성
 */
async function generateFallbackAnalysis(
  stockName: string,
  stockCode: string,
  monthLabel: string,
  consensus: ConsensusData | null,
  news: NewsItem[],
  recentReports: ResearchReport[]
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return '> ⚠️ AI 분석을 위해 `.env.local`에 `GOOGLE_API_KEY`를 설정해주세요.';
  }

  const ai = new GoogleGenAI({ apiKey });

  // 투자의견 점수 → 텍스트 변환
  const opinionScore = consensus ? parseFloat(consensus.opinion) : 0;
  let opinionText = '없음';
  if (opinionScore >= 4.5) opinionText = '적극매수(Strong Buy)';
  else if (opinionScore >= 3.5) opinionText = '매수(Buy)';
  else if (opinionScore >= 2.5) opinionText = '중립(Hold)';
  else if (opinionScore >= 1.5) opinionText = '매도(Sell)';
  else if (opinionScore > 0) opinionText = '적극매도(Strong Sell)';

  // 컨센서스 정보
  const consensusText = consensus
    ? `- 투자의견: ${opinionText} (${parseFloat(consensus.opinion).toFixed(2)}/5.00)\n- 컨센서스 목표주가: ${Number(consensus.targetPrice).toLocaleString()}원\n- 기준일: ${consensus.date}`
    : '- 컨센서스 데이터 없음';

  // 뉴스 요약
  const newsText = news.length > 0
    ? news.map((n, i) => `${i + 1}. [${n.officeName}] ${n.title}\n   ${n.body.substring(0, 150)}...`).join('\n')
    : '- 최근 뉴스 없음';

  // 직전 리포트 정보
  const recentText = recentReports.length > 0
    ? recentReports.map((r, i) =>
        `${i + 1}. [${r.date}] ${r.firm} — ${r.title} (목표: ${r.targetPrice}, 의견: ${r.opinion})`
      ).join('\n')
    : '- 직전 리포트 없음';

  const prompt = `당신은 한국 주식 시장의 시니어 리서치 애널리스트입니다.
${stockName}(${stockCode})에 대한 ${monthLabel} 종합 분석 보고서를 작성해주세요.

⚠️ 이번 달(${monthLabel})에 발행된 증권사 리포트는 없습니다.
아래 데이터들을 종합하여 전문 애널리스트 수준의 종합 분석 보고서를 작성하세요.

=== 증권사 컨센서스 ===
${consensusText}

=== 최신 뉴스 (최근 10건) ===
${newsText}

=== 직전 증권사 리포트 (최근 5건) ===
${recentText}

다음 형식으로 종합 분석 보고서를 작성해주세요:

## 📊 ${stockName} 종합 분석 리포트

> ℹ️ ${monthLabel}에 발행된 증권사 리포트가 없어, 컨센서스·최신 뉴스·직전 리포트를 종합하여 분석했습니다.

### 1. 투자 요약
증권사 컨센서스 기반 투자의견, 목표주가, 현재 밸류에이션 수준을 간결하게 정리

### 2. 최신 뉴스 핵심 요약
최근 뉴스에서 파악되는 핵심 이슈 3~5개를 분석

### 3. 증권사 시각 (직전 리포트 기반)
직전 리포트들에서 공통적으로 언급되는 테마, 실적 전망, 리스크 요인 정리

### 4. 투자 시사점
위 데이터를 종합한 투자 시사점과 주의할 점을 3~5문장으로 작성

마크다운 형식으로 작성하고, 구체적인 수치를 반드시 포함하세요.
제공된 데이터에 기반해서만 작성하고, 없는 내용을 만들지 마세요.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || '';
  } catch (e) {
    console.error('[stock-report] Gemini API error (fallback):', e);
    return `> ⚠️ AI 분석 생성 중 오류가 발생했습니다: ${e instanceof Error ? e.message : String(e)}`;
  }
}
