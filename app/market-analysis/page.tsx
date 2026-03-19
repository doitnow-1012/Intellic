'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdSense } from '@/components/AdSense';
import { BarChart3, ChevronLeft, ChevronRight, Terminal, Clock, Loader2, X, TrendingUp, TrendingDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';

interface MarketPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface ThemeStock {
  name: string;
  code: string;
  price: number;
  change_pct: number;
}

interface ThemeStockData {
  theme_no: string;
  avg_change_pct: number;
  stock_count: number;
  stocks: ThemeStock[];
}

export default function MarketAnalysisPage() {
  const [reports, setReports] = useState<MarketPost[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [themeModal, setThemeModal] = useState<{ name: string; data: ThemeStockData } | null>(null);
  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      const { data, error } = await supabase
        .from('market_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
      } else if (data && data.length > 0) {
        setReports(data);
        setSelectedReportId(data[0].id);
      }
      setLoading(false);
    }

    fetchReports();
  }, []);

  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0];

  // 보고서 content에서 테마별 종목 JSON 파싱
  const themeStocksMap = useMemo<Record<string, ThemeStockData>>(() => {
    if (!selectedReport?.content) return {};
    const match = selectedReport.content.match(/<!-- THEME_STOCKS_DATA:(.*?) -->/);
    if (!match) return {};
    try {
      return JSON.parse(match[1]);
    } catch {
      return {};
    }
  }, [selectedReport]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReports = reports.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`;
  };

  // 테마명 클릭 핸들러
  const handleThemeClick = (themeName: string) => {
    const data = themeStocksMap[themeName];
    if (data && data.stocks && data.stocks.length > 0) {
      setThemeModal({ name: themeName, data });
    }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setThemeModal(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <span className="ml-3 text-zinc-400">데이터를 불러오는 중...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-zinc-600" />
          <h3 className="mt-4 text-lg font-medium text-zinc-400">아직 작성된 보고서가 없습니다</h3>
          <p className="mt-2 text-sm text-zinc-500">파이썬 스크립트를 실행하여 분석 보고서를 생성하세요.</p>
        </div>
      )}

      {/* Data Loaded */}
      {!loading && reports.length > 0 && (
        <>
          {/* Table Section */}
          <div className="rounded-xl border border-white/10 bg-zinc-900/30 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-400">
              <span>제목</span>
              <span>등록일자</span>
            </div>
            <div className="divide-y divide-white/5">
              {paginatedReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-white/5 ${
                    selectedReportId === report.id ? 'bg-white/5 text-amber-500' : 'text-zinc-300'
                  }`}
                >
                  <span className="truncate pr-4 text-sm sm:text-base">{report.title}</span>
                  <span className="shrink-0 text-xs sm:text-sm text-zinc-500">{formatDate(report.created_at)}</span>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3">
                <span className="text-xs text-zinc-500">
                  전체 {reports.length}건 중 {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, reports.length)}건
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center h-8 w-8 rounded-md border border-white/10 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-amber-500 text-black'
                          : 'border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center h-8 w-8 rounded-md border border-white/10 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AdSense Section */}
          <AdSense />

          {/* Detail View Section */}
          {selectedReport && (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 md:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                  {selectedReport.title}
                </h2>
                <span className="shrink-0 text-sm md:text-base text-zinc-500 font-medium md:mt-1">
                  {formatDate(selectedReport.created_at)}
                </span>
              </div>
              
              <div className="h-px w-full bg-white/10 mb-8" />
              
              {(() => {
                const rawContent = selectedReport.content.replace(/<!-- THEME_STOCKS_DATA:[\s\S]*? -->/g, '');
                // 시장지수현황, 종합관전포인트 기준으로 콘텐츠 분할
                const parts: string[] = [];
                const adPositions = new Set<number>(); // 광고 삽입할 인덱스

                const sectionMarkers = ['## 📈 시장 지수 현황', '## 🔍 종합 관전 포인트'];
                let remaining = rawContent;

                for (const marker of sectionMarkers) {
                  const idx = remaining.indexOf(marker);
                  if (idx > 0) {
                    parts.push(remaining.slice(0, idx));
                    adPositions.add(parts.length); // 이 위치에 광고 삽입
                    remaining = remaining.slice(idx);
                  }
                }
                parts.push(remaining);

                const markdownComponents = {
                    a: ({node, ...props}: any) => <a target="_blank" rel="noopener noreferrer" {...props} />,
                    table: ({node, ...props}: any) => (
                      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                        <table className="min-w-[500px] w-full" {...props} />
                      </div>
                    ),
                    td: ({node, children, ...props}: any) => {
                      const text = extractText(children);
                      if (text && themeStocksMap[text]) {
                        return (
                          <td {...props}>
                            <button 
                              onClick={() => handleThemeClick(text)}
                              className="font-bold text-amber-500 hover:text-amber-400 hover:underline underline-offset-2 cursor-pointer transition-colors"
                              title="클릭하여 테마 종목 보기"
                            >
                              {text}
                            </button>
                          </td>
                        );
                      }
                      return <td {...props}>{children}</td>;
                    },
                    strong: ({node, children, ...props}: any) => {
                      const text = extractText(children);
                      if (text && themeStocksMap[text]) {
                        return (
                          <strong
                            onClick={() => handleThemeClick(text)}
                            className="text-amber-500 hover:text-amber-400 cursor-pointer hover:underline underline-offset-2 transition-colors"
                            title="클릭하여 테마 종목 보기"
                            {...props}
                          >
                            {children}
                          </strong>
                        );
                      }
                      return <strong {...props}>{children}</strong>;
                    }
                  };

                return parts.map((part, i) => (
                  <div key={i}>
                    {adPositions.has(i) && (
                      <div className="my-6">
                        <AdSense slot="4126889793" format="auto" />
                      </div>
                    )}
                    <div className="prose prose-invert prose-zinc max-w-none prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-table:border-white/10 prose-th:bg-white/5 prose-th:px-2 prose-th:py-2 sm:prose-th:px-3 sm:prose-th:py-3 prose-td:px-2 prose-td:py-2 sm:prose-td:px-3 sm:prose-td:py-3 prose-td:border-t prose-td:border-white/10 prose-th:text-xs sm:prose-th:text-sm prose-td:text-xs sm:prose-td:text-sm">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {part}
                      </ReactMarkdown>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </>
      )}

      {/* Theme Stocks Modal */}
      {themeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setThemeModal(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-lg max-h-[80vh] rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-900/95 backdrop-blur-sm px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">{themeModal.name}</h3>
                <p className="text-sm text-zinc-400 mt-0.5">
                  평균등락 <span className={themeModal.data.avg_change_pct >= 0 ? 'text-red-400' : 'text-blue-400'}>
                    {themeModal.data.avg_change_pct >= 0 ? '+' : ''}{themeModal.data.avg_change_pct}%
                  </span>
                  {' · '}총 {themeModal.data.stocks.length}개 종목
                </p>
              </div>
              <button 
                onClick={() => setThemeModal(null)}
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stock List */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Table Header */}
              <div className="sticky top-0 grid grid-cols-12 gap-2 bg-white/5 px-6 py-2.5 text-xs font-medium text-zinc-500 border-b border-white/10">
                <span className="col-span-1 text-center">#</span>
                <span className="col-span-5">종목명</span>
                <span className="col-span-3 text-right">현재가</span>
                <span className="col-span-3 text-right">등락률</span>
              </div>

              {/* Stock Rows */}
              {themeModal.data.stocks.map((stock, idx) => (
                <div 
                  key={stock.code || idx}
                  className="grid grid-cols-12 gap-2 items-center px-6 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <span className="col-span-1 text-center text-xs text-zinc-600 font-mono">{idx + 1}</span>
                  <div className="col-span-5 flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200 truncate">{stock.name}</span>
                    {stock.code && (
                      <span className="text-[10px] text-zinc-600 font-mono shrink-0">{stock.code}</span>
                    )}
                  </div>
                  <span className="col-span-3 text-right text-sm font-mono text-zinc-300">
                    {stock.price.toLocaleString()}
                  </span>
                  <div className="col-span-3 flex items-center justify-end gap-1">
                    {stock.change_pct > 0 ? (
                      <TrendingUp className="h-3 w-3 text-red-400" />
                    ) : stock.change_pct < 0 ? (
                      <TrendingDown className="h-3 w-3 text-blue-400" />
                    ) : null}
                    <span className={`text-sm font-mono font-medium ${
                      stock.change_pct > 0 ? 'text-red-400' : stock.change_pct < 0 ? 'text-blue-400' : 'text-zinc-500'
                    }`}>
                      {stock.change_pct > 0 ? '+' : ''}{stock.change_pct}%
                    </span>
                  </div>
                </div>
              ))}

              {themeModal.data.stocks.length === 0 && (
                <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
                  종목 데이터가 없습니다
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 bg-white/[0.02] px-6 py-3">
              <p className="text-[11px] text-zinc-600 text-center">
                데이터 출처: 네이버 금융 테마별 시세
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// children에서 순수 텍스트 추출 유틸리티
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(extractText).join('');
  }
  if (children && typeof children === 'object' && 'props' in children) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractText((children as any).props.children);
  }
  return '';
}
