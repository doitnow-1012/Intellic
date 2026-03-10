'use client';

import { useState } from 'react';
import { AdSense } from '@/components/AdSense';
import { BarChart3, ChevronLeft, ChevronRight, Terminal, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Mock Data based on the python script output
const reports = [
  {
    id: 1,
    title: '한국 주식시장 브리핑 — 2026년 03월 10일 (화) 06:39',
    date: '2026. 03. 10',
    content: `
# 📊 한국 주식시장 브리핑 — 2026년 03월 10일 (화)

> 생성 시각: 06:39 KST

---
## 📈 시장 지수 현황

| 지수 | 종가 | 전일 대비 | 등락률 |
|------|------|-----------|--------|
| 🔴 **KOSPI** | 2,750.20 | +15.30 | +0.56% |
| 🔴 **KOSDAQ** | 870.50 | +5.20 | +0.60% |
| 🔴 **USD/KRW** | 1,320.50 | +2.50 | +0.19% |
| 🔴 **S&P500** | 5,150.20 | +20.10 | +0.39% |
| 🔴 **NASDAQ** | 16,200.50 | +80.20 | +0.50% |

---
## 🔥 강세 테마 TOP 5

> 전체 250개 테마 중 상승 180개 / 하락 50개 (평균 +0.85%)

| 순위 | 테마 | 평균등락 | 최대등락 | 상승비율 | 종목수 | 상위 종목 |
|:----:|------|:--------:|:--------:|:--------:|:------:|-----------|
| 1 | **반도체 장비** | +3.50% | +15.20% | 85.0% | 40 | 한미반도체(+15.2%), HPSP(+8.5%), 주성엔지니어링(+5.2%) |
| 2 | **AI 챗봇** | +2.80% | +12.50% | 80.0% | 25 | 폴라리스오피스(+12.5%), 마음AI(+7.2%), 코난테크놀로지(+5.1%) |
| 3 | **전력설비** | +2.50% | +10.20% | 75.0% | 30 | HD현대일렉트릭(+10.2%), LS일렉트릭(+6.5%), 효성중공업(+4.2%) |
| 4 | **바이오시밀러** | +2.10% | +8.50% | 70.0% | 20 | 셀트리온(+8.5%), 삼성바이오로직스(+4.2%), 알테오젠(+3.1%) |
| 5 | **로봇(산업용/협동로봇)** | +1.80% | +7.50% | 65.0% | 35 | 두산로보틱스(+7.5%), 레인보우로보틱스(+5.2%), 에스피지(+3.1%) |

---
## 🔍 종합 관전 포인트

1. 📊 시장 양호: 전체 250개 테마 중 180개 상승 (72%), 평균 +0.85%
2. 🤖 AI/반도체 테마 주도: 반도체 장비, AI 챗봇 등 상위권 포진
3. 🔥 1위 테마 '반도체 장비' → 평균 +3.50%, 상승비율 85.0%
4. 📈 KOSPI 2,750.20 (+0.56% 상승)
5. 💱 환율 안정: USD/KRW 1,320.50원
6. 🇺🇸 미국 증시 강세: S&P500 +0.39%, NASDAQ +0.50% → 국내 증시 상승 기대
7. 📰 뉴스 키워드 주목: [AI/반도체] 관련 보도 다수 — 해당 섹터 변동성 주의

---
## 📰 시장 주요 뉴스 TOP 10

**1.** [엔비디아 훈풍에 K-반도체 투톱 동반 강세... KOSPI 2750선 안착](https://finance.naver.com/news/news_read.naver?article_id=0004300001&office_id=015) — 네이버금융

**2.** [AI 수요 폭발에 전력설비주 '슈퍼사이클' 진입 기대감](https://finance.naver.com/news/news_read.naver?article_id=0004300002&office_id=015) — 네이버금융

**3.** [외국인, 코스피 5거래일 연속 순매수... 반도체·자동차 집중](https://finance.naver.com/news/news_read.naver?article_id=0004300003&office_id=015) — 네이버금융

**4.** [금리 인하 기대감 솔솔... 제약·바이오주 반등 시동](https://finance.naver.com/news/news_read.naver?article_id=0004300004&office_id=015) — 네이버금융

**5.** [정부 밸류업 프로그램 구체화... 저PBR 금융주 다시 들썩](https://finance.naver.com/news/news_read.naver?article_id=0004300005&office_id=015) — 네이버금융

**6.** [애플 비전프로 출시 임박... 메타버스 관련주 재조명](https://finance.naver.com/news/news_read.naver?article_id=0004300006&office_id=015) — 네이버금융

**7.** [테슬라 인도량 예상치 하회... 2차전지주 투자심리 위축](https://finance.naver.com/news/news_read.naver?article_id=0004300007&office_id=015) — 네이버금융

**8.** [한은, 기준금리 3.50% 동결... "물가 둔화 추세 확인 필요"](https://finance.naver.com/news/news_read.naver?article_id=0004300008&office_id=015) — 네이버금융

**9.** [비트코인 사상 최고가 경신... 가상화폐 관련주 동반 강세](https://finance.naver.com/news/news_read.naver?article_id=0004300009&office_id=015) — 네이버금융

**10.** [국제유가 100달러 돌파 임박... 정유·가스주 '들썩'](https://finance.naver.com/news/news_read.naver?article_id=0004300010&office_id=015) — 네이버금융

---
## 🔑 뉴스에서 읽는 핵심 시그널

1. 🤖 **[AI/반도체]** AI/반도체 모멘텀 지속 — 반도체, 엔비디아, AI 관련 보도 다수. 글로벌 AI 투자 확대 흐름에서 국내 반도체 밸류체인 수혜 기대
2. 💰 **[금리/통화정책]** 금리/통화정책 변동 — 금리, 기준금리, 인하 키워드 감지. 성장주·부동산·금융주 민감 반응 예상
3. 🌊 **[외국인/수급]** 수급 흐름 주목 — 외국인, 순매수 관련 보도. 외국인·기관 자금 흐름이 지수 방향성 결정 핵심
4. ⛽ **[유가/원자재]** 유가 변동 주목 — 유가, 100달러 키워드 감지. 정유·화학·항공·운송 섹터 변동성 확대 예상
5. 📋 **[정책/규제]** 정책·규제 변화 — 정부, 정책 관련 보도. 정책 수혜/피해 종목군 선별 필요

---
> ⚠️ 본 브리핑은 자동 수집·분석 결과이며 투자 권유가 아닙니다. 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.

*데이터 소스: FinanceDataReader, 네이버 금융 테마별 시세, 네이버 뉴스*  
*생성 시각: 2026-03-10 06:39 KST*
`
  },
  {
    id: 2,
    title: '데일리 테마(비료/ 사료/ 농업,LPG/ 도시가스 등,반도체/ 2차전지/ 로봇 등,제약/바이오 관련주,자동차 대표주/ 자동차부품,석유화학...',
    date: '2026. 03. 09',
    content: `- 테마시황 -\n\n▷전일 대비 전반적인 시장 하락세 지속. 주요 테마 약세 흐름 전개 중.\n\n▷환율 급등에 따른 외국인 수급 이탈 우려 지속.`
  },
  {
    id: 3,
    title: '데일리 테마(태양광에너지/ 풍력에너지,방위산업/전쟁 및 테러,반도체 관련주,2차전지 등,게임/ 모바일게임(스마트폰),화장품,증권)',
    date: '2026. 03. 06',
    content: `- 테마시황 -\n\n▷신재생 에너지 관련 정책 기대감에 태양광/풍력 테마 강세.\n\n▷지정학적 리스크 부각에 방위산업 테마 상승.`
  },
  {
    id: 4,
    title: '데일리 테마(반도체/ 2차전지 등,로봇/ 스마트팩토리 등,스페이스X(SpaceX)/ 우주항공산업(누리호/인공위성 등),조선/ 조선기자재,증권...',
    date: '2026. 03. 05',
    content: `- 테마시황 -\n\n▷우주항공청 설립 및 스페이스X 프로젝트 모멘텀에 우주항공산업 테마 강세.\n\n▷조선업 슈퍼사이클 기대감 지속에 조선/기자재 테마 상승.`
  },
  {
    id: 5,
    title: '데일리 테마(LPG/ 도시가스 등,사료,반도체/ 자동차/ 2차전지 등,제약/바이오,건설 대표주,철강 주요종목/ 철강 중소형,여행/ 항공 등...',
    date: '2026. 03. 04',
    content: `- 테마시황 -\n\n▷원자재 가격 변동성 확대에 따른 철강 및 에너지 관련주 등락 교차.\n\n▷리오프닝 기대감 지연으로 여행/항공 테마 약세.`
  },
];

export default function MarketAnalysisPage() {
  const [selectedReportId, setSelectedReportId] = useState(reports[0].id);
  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0];

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-amber-500/10 p-2 text-amber-500 ring-1 ring-amber-500/20">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            시장분석
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-zinc-400">
          파이썬 기반 알고리즘이 매일 글로벌 매크로 지표와 증시 시황을 서칭하여 자동으로 생성한 분석 보고서입니다.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-md w-fit border border-emerald-500/20">
            <Terminal className="h-3.5 w-3.5" />
            <span>Python Analysis Engine Active</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-md w-fit border border-blue-500/20">
            <Clock className="h-3.5 w-3.5" />
            <span>1시간 주기 자동 업데이트 활성화됨</span>
          </div>
        </div>
      </header>

      {/* Table Section */}
      <div className="rounded-xl border border-white/10 bg-zinc-900/30 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-400">
          <span>제목</span>
          <span>등록일자</span>
        </div>
        <div className="divide-y divide-white/5">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReportId(report.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-white/5 ${
                selectedReportId === report.id ? 'bg-white/5 text-amber-500' : 'text-zinc-300'
              }`}
            >
              <span className="truncate pr-4 text-sm sm:text-base">{report.title}</span>
              <span className="shrink-0 text-xs sm:text-sm text-zinc-500">{report.date}</span>
            </button>
          ))}
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-end gap-1 border-t border-white/10 p-4 text-sm">
          <button className="p-1 text-zinc-500 hover:text-amber-500 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="px-2.5 py-1 rounded text-amber-500 font-medium">1</button>
          <button className="px-2.5 py-1 rounded text-zinc-500 hover:text-amber-500 transition-colors">2</button>
          <button className="px-2.5 py-1 rounded text-zinc-500 hover:text-amber-500 transition-colors">3</button>
          <button className="px-2.5 py-1 rounded text-zinc-500 hover:text-amber-500 transition-colors">4</button>
          <button className="px-2.5 py-1 rounded text-zinc-500 hover:text-amber-500 transition-colors">5</button>
          <button className="p-1 text-zinc-500 hover:text-amber-500 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AdSense Section */}
      <AdSense />

      {/* Detail View Section */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
            {selectedReport.title}
          </h2>
          <span className="shrink-0 text-sm md:text-base text-zinc-500 font-medium md:mt-1">
            {selectedReport.date}
          </span>
        </div>
        
        <div className="h-px w-full bg-white/10 mb-8" />
        
        <div className="prose prose-invert prose-zinc max-w-none prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-table:border-white/10 prose-th:bg-white/5 prose-th:p-3 prose-td:p-3 prose-td:border-t prose-td:border-white/10">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" {...props} />
            }}
          >
            {selectedReport.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
