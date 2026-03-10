import { AdSense } from '@/components/AdSense';
import { ArrowRight, BarChart3, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
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
              <Activity className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-white">특징주분석</h2>
            <p className="mt-2 text-sm text-zinc-400">
              당일 거래량 급증, 주요 공시 등 시장의 주목을 받은 특징적인 종목들을 분석합니다.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-medium text-amber-500">
            분석 보기 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
      </div>

      <AdSense />

      {/* Recent Reports Section (Mockup) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">최신 분석 리포트</h2>
          <Link href="/market-analysis" className="text-sm font-medium text-amber-500 hover:text-amber-400">
            전체보기
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 overflow-hidden">
          <div className="divide-y divide-white/5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 transition-colors hover:bg-white/5 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400 sm:flex">
                    {i}0월
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                        {i === 1 ? '시장분석' : i === 2 ? '특징주' : '종목분석'}
                      </span>
                      <span className="text-xs text-zinc-500">2023.10.{20 - i}</span>
                    </div>
                    <h3 className="mt-1 font-medium text-white">
                      {i === 1 ? 'FOMC 금리 동결 이후의 시장 방향성 점검' : i === 2 ? '초전도체 관련주 급등락 원인 분석' : '삼성전자 3분기 실적 리뷰 및 향후 전망'}
                    </h3>
                  </div>
                </div>
                <Link href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 transition-colors hover:bg-amber-500 hover:text-black">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
