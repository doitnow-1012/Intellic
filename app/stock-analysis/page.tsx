'use client';

import { useState } from 'react';
import { Search, FileText, Loader2, AlertCircle, ExternalLink, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { AdSense } from '@/components/AdSense';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResearchReport {
  title: string;
  firm: string;
  date: string;
  targetPrice: string;
  opinion: string;
  url: string;
  summary?: string;
}

interface StockReportResult {
  stockName: string;
  stockCode: string;
  month: string;
  reports: ResearchReport[];
  overallSummary: string;
}

export default function StockAnalysisPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<StockReportResult | null>(null);
  const [error, setError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setExpandedIdx(null);
    setStatus('종목 정보 확인 중...');

    try {
      setStatus('증권사 리포트 수집 및 PDF 1페이지 추출 중...');

      const res = await fetch('/api/stock-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockName: query.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '오류가 발생했습니다.');
        return;
      }

      setStatus('AI 종합 분석 완료!');
      setResult(data);
    } catch (e) {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  // 투자의견 뱃지 색상
  const getOpinionStyle = (opinion: string) => {
    if (opinion.includes('매수') || opinion.toLowerCase().includes('buy'))
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    if (opinion.includes('매도') || opinion.toLowerCase().includes('sell'))
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (opinion.includes('중립') || opinion.toLowerCase().includes('hold'))
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-amber-500/10 p-2 text-amber-500 ring-1 ring-amber-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            종목분석
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-zinc-400">
          종목명을 입력하면 최신 증권사 리포트를 자동 수집하고, 이를 바탕으로 AI가 분석합니다.
          <br />
          최신 증권사 리포트가 없으면, AI가 최신 뉴스와 컨센서스를 바탕으로 분석합니다.
        </p>
      </header>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="종목명 또는 종목코드 입력 (예: 삼성전자, 005930)"
            disabled={loading}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/50 py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 outline-none transition-all focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-medium text-black transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              분석 중
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              분석
            </>
          )}
        </button>
      </div>

      {/* AdSense Display Ad */}
      <AdSense slot="4126889793" format="auto" />

      {/* Loading Status */}
      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <span className="text-amber-400">{status}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8">
          {/* Header Info */}
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-bold text-white">
              {result.stockName}
              <span className="ml-2 text-base font-normal text-zinc-500">({result.stockCode})</span>
            </h2>
            <span className="rounded-lg bg-white/5 px-3 py-1 text-sm text-zinc-400 ring-1 ring-white/10">
              {result.month}
            </span>
            <span className="rounded-lg bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-500 ring-1 ring-amber-500/20">
              {result.reports.length}건의 리포트
            </span>
          </div>

          {/* AI Overall Summary — 먼저 표시 */}
          {result.overallSummary && (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 md:p-8 shadow-xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="inline-flex rounded-lg bg-emerald-500/10 p-2 text-emerald-500 ring-1 ring-emerald-500/20">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">AI 종합 분석</h3>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                  Gemini AI
                </span>
              </div>

              <div className="h-px w-full bg-white/10 mb-6" />

              <div className="prose prose-invert prose-zinc max-w-none prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-table:border-white/10 prose-th:bg-white/5 prose-th:p-3 prose-td:p-3 prose-td:border-t prose-td:border-white/10 prose-headings:text-white prose-strong:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.overallSummary}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Reports Table */}
          {result.reports.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-zinc-900/30 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                <h3 className="text-sm font-semibold text-zinc-300">📋 개별 리포트 상세</h3>
              </div>
              {/* Table Header */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_120px_80px_40px] items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <span>제목</span>
                <span>증권사</span>
                <span>날짜</span>
                <span className="text-right">목표주가</span>
                <span className="text-center">의견</span>
                <span></span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-white/5">
                {result.reports.map((report, idx) => (
                  <div key={idx}>
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-[1fr_120px_100px_120px_80px_40px] items-center gap-2 px-4 py-3.5 transition-colors hover:bg-white/5 cursor-pointer ${
                        expandedIdx === idx ? 'bg-white/5' : ''
                      }`}
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 shrink-0 text-zinc-600" />
                        <span className="truncate text-sm font-medium text-white">
                          {report.title}
                        </span>
                      </div>
                      <span className="text-sm text-zinc-400">{report.firm}</span>
                      <span className="text-sm text-zinc-500">{report.date}</span>
                      <span className="text-right text-sm font-medium text-amber-400">
                        {report.targetPrice}
                      </span>
                      <div className="flex justify-center">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs font-medium ${getOpinionStyle(
                            report.opinion
                          )}`}
                        >
                          {report.opinion}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        {report.url && (
                          <a
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-500 hover:text-amber-500 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {expandedIdx === idx ? (
                          <ChevronUp className="h-4 w-4 text-zinc-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-zinc-500" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail — PDF 1페이지 전체 텍스트 */}
                    {expandedIdx === idx && report.summary && (
                      <div className="border-t border-white/5 bg-zinc-900/80 px-6 py-4">
                        <div className="mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-zinc-500" />
                          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">PDF 1페이지 추출 내용</span>
                        </div>
                        <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap">
                          {report.summary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-zinc-600" />
              <p className="mt-3 text-zinc-400">
                {result.month}에 발행된 리포트가 없습니다.
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="rounded-lg border border-white/5 bg-zinc-900/20 p-4 text-xs text-zinc-600">
            ⚠️ 본 분석은 AI가 네이버 증권 리서치 리포트 PDF를 기반으로 자동 생성한 참고 자료입니다.
            투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.
            원본 리포트 확인을 위해 각 리포트의 외부 링크를 참조해주세요.
          </div>
        </div>
      )}
    </div>
  );
}
