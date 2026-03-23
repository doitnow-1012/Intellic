'use client';

import { useState, useEffect } from 'react';
import { AdSense } from '@/components/AdSense';
import { ArrowRight, BarChart3, TrendingUp, Newspaper, LineChart } from 'lucide-react';
import Link from 'next/link';

interface RecentColumn {
  id: string;
  title: string;
  category: string;
  slug: string;
  created_at: string;
}

export default function Home() {
  const [recentColumns, setRecentColumns] = useState<RecentColumn[]>([]);

  useEffect(() => {
    fetch('/api/columns')
      .then(res => res.json())
      .then(data => setRecentColumns(data.slice(0, 5)))
      .catch(console.error);
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          실시간 금융 데이터 인텔리전스
        </h1>
        <div className="max-w-3xl space-y-4 text-lg text-zinc-400">
          <p>
            <span className="font-bold tracking-tight text-white">Intell<span className="text-amber-500">ic</span></span>은 파이썬 기반의 자동화된 데이터 수집 및 분석 알고리즘을 통해 투자자들에게 가장 신속하고<br />
            정확한 시장 정보를 제공하는 플랫폼입니다.
          </p>
          <p>
            매일 쏟아지는 방대한 금융 데이터 속에서 유의미한 시그널을 찾아내고, 이를 직관적이고 이해하기<br />
            쉬운 형태의 보고서로 가공하여 전달합니다.
          </p>
          <p>
            우리의 목표는 개인 투자자들도 기관 수준의 데이터 인텔리전스를 활용할 수 있도록 돕는 것입니다.
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Market Analysis Card */}
        <Link href="/market-analysis" className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:border-amber-500/50 hover:bg-zinc-900">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl transition-all group-hover:bg-amber-500/20" />
          <div>
            <div className="mb-4 inline-flex rounded-lg bg-white/5 p-3 text-amber-500 ring-1 ring-white/10">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-white">시장분석</h2>
            <p className="mt-2 text-sm text-zinc-400">
              글로벌 매크로 지표와 국내외 증시 시황을 종합적으로 분석한 일일 보고서입니다.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-medium text-amber-500">
            보고서 보기 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Featured Stocks Card */}
        <Link href="/featured-stocks" className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:border-amber-500/50 hover:bg-zinc-900">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl transition-all group-hover:bg-amber-500/20" />
          <div>
            <div className="mb-4 inline-flex rounded-lg bg-white/5 p-3 text-amber-500 ring-1 ring-white/10">
              <Newspaper className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-white">경제칼럼</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Gemini Deep Research 기반 AI가 분석한 경제·산업 심층 칼럼을 제공합니다.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-medium text-amber-500">
            칼럼 보기 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Stock Analysis Card */}
        <Link href="/stock-analysis" className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:border-amber-500/50 hover:bg-zinc-900">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl transition-all group-hover:bg-amber-500/20" />
          <div>
            <div className="mb-4 inline-flex rounded-lg bg-white/5 p-3 text-amber-500 ring-1 ring-white/10">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-white">종목분석</h2>
            <p className="mt-2 text-sm text-zinc-400">
              개별 기업의 펀더멘털, 재무제표, 차트 분석을 통한 심층적인 종목 리포트를 제공합니다.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-medium text-amber-500">
            리포트 보기 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Simulation Card */}
        <Link href="/simulation" className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:border-amber-500/50 hover:bg-zinc-900">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl transition-all group-hover:bg-amber-500/20" />
          <div>
            <div className="mb-4 inline-flex rounded-lg bg-white/5 p-3 text-amber-500 ring-1 ring-white/10">
              <LineChart className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-white">시뮬레이션</h2>
            <p className="mt-2 text-sm text-zinc-400">
              트레이딩 패턴별 백테스트 결과를 차트와 통계로 시각화합니다.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-medium text-amber-500">
            결과 보기 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      <AdSense />

      {/* Recent Columns Section */}
      {recentColumns.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">최신 경제칼럼</h2>
            <Link href="/featured-stocks" className="text-sm font-medium text-amber-500 hover:text-amber-400">
              전체보기
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900/30 overflow-hidden">
            <div className="divide-y divide-white/5">
              {recentColumns.map((col) => (
                <Link
                  key={col.id}
                  href={`/featured-stocks/${col.slug}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-white/5 sm:p-6 group"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                          {col.category}
                        </span>
                        <span className="text-xs text-zinc-500">{formatDate(col.created_at)}</span>
                      </div>
                      <h3 className="mt-1 font-medium text-white group-hover:text-amber-400 transition-colors">
                        {col.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-400 transition-colors group-hover:bg-amber-500 group-hover:text-black">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
