import { AdSense } from '@/components/AdSense';
import { ArrowRight, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

export default function FeaturedStocksPage() {
  const reports = [
    {
      id: 1,
      title: '초전도체 관련주 급등락 원인 분석',
      date: '2023-10-19',
      summary: '최근 학계의 발표와 관련하여 초전도체 테마주들의 변동성이 극심해지고 있습니다. 각 종목별 수급 동향을 점검합니다.',
      type: 'up',
    },
    {
      id: 2,
      title: '2차전지 밸류체인 조정 장세 진입',
      date: '2023-10-18',
      summary: '전기차 수요 둔화 우려로 2차전지 소재주들의 주가가 조정을 받고 있습니다. 하락폭과 지지선을 분석합니다.',
      type: 'down',
    },
    {
      id: 3,
      title: 'AI 반도체 수혜주 실적 모멘텀 부각',
      date: '2023-10-17',
      summary: '글로벌 AI 투자 확대에 따라 HBM 등 고대역폭 메모리 관련 장비주들의 수주 기대감이 주가에 반영되고 있습니다.',
      type: 'up',
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-amber-500/10 p-2 text-amber-500 ring-1 ring-amber-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            특징주분석
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-zinc-400">
          당일 거래량 급증, 주요 공시 등 시장의 주목을 받은 특징적인 종목들을 분석합니다.
        </p>
      </header>

      <AdSense />

      <div className="grid gap-6">
        {reports.map((report) => (
          <Link
            key={report.id}
            href={`/featured-stocks/${report.id}`}
            className="group block rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:border-amber-500/50 hover:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <time dateTime={report.date}>{report.date}</time>
              </div>
              <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                report.type === 'up' 
                  ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20'
              }`}>
                {report.type === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {report.type === 'up' ? '급등주' : '급락주'}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white group-hover:text-amber-400 transition-colors">
              {report.title}
            </h2>
            <p className="mt-2 text-zinc-400 line-clamp-2">
              {report.summary}
            </p>
            <div className="mt-6 flex items-center text-sm font-medium text-amber-500">
              분석 보기 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
