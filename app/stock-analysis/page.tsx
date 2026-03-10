import { AdSense } from '@/components/AdSense';
import { ArrowRight, TrendingUp, Building2, PieChart } from 'lucide-react';
import Link from 'next/link';

export default function StockAnalysisPage() {
  const reports = [
    {
      id: 1,
      ticker: '005930',
      name: '삼성전자',
      title: '3분기 실적 리뷰 및 향후 전망',
      date: '2023-10-19',
      summary: '메모리 반도체 감산 효과 가시화 및 스마트폰 신제품 판매 호조로 시장 기대치를 상회하는 실적을 기록했습니다.',
    },
    {
      id: 2,
      ticker: '035420',
      name: 'NAVER',
      title: 'AI 서비스 본격화에 따른 성장 모멘텀',
      date: '2023-10-18',
      summary: '하이퍼클로바X 공개 이후 B2B 서비스 확장과 커머스 부문의 견조한 성장이 실적을 견인할 것으로 예상됩니다.',
    },
    {
      id: 3,
      ticker: '000270',
      name: '기아',
      title: '친환경차 판매 비중 확대와 수익성 개선',
      date: '2023-10-17',
      summary: 'EV9 등 고수익 차종 중심의 믹스 개선과 환율 효과로 사상 최대 실적 행진을 이어가고 있습니다.',
    },
  ];

  return (
    <div className="space-y-12">
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
          개별 기업의 펀더멘털, 재무제표, 차트 분석을 통한 심층적인 종목 리포트를 제공합니다.
        </p>
      </header>

      <AdSense />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link
            key={report.id}
            href={`/stock-analysis/${report.id}`}
            className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:border-amber-500/50 hover:bg-zinc-900"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-zinc-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{report.name}</h3>
                    <span className="text-xs text-zinc-500">{report.ticker}</span>
                  </div>
                </div>
                <time dateTime={report.date} className="text-xs text-zinc-500">
                  {report.date}
                </time>
              </div>
              <div className="mt-6">
                <h4 className="font-medium text-white group-hover:text-amber-400 transition-colors">
                  {report.title}
                </h4>
                <p className="mt-2 text-sm text-zinc-400 line-clamp-3">
                  {report.summary}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <PieChart className="h-4 w-4" />
                <span>펀더멘털 분석</span>
              </div>
              <div className="flex items-center text-sm font-medium text-amber-500">
                리포트 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
