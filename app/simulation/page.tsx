'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Loader2, Clock, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';

interface SimulationData {
  id: string;
  run_at: string;
  date_from: string | null;
  date_to: string | null;
  // P0
  p0_s_count: number; p0_s_winrate: number; p0_s_avg: number; p0_s_cumul: number;
  p0_n_count: number; p0_n_winrate: number; p0_n_avg: number; p0_n_cumul: number;
  p0_total_count: number; p0_total_winrate: number; p0_total_cumul: number;
  // P1
  p1_s_count: number; p1_s_winrate: number; p1_s_avg: number; p1_s_cumul: number;
  p1_a_count: number; p1_a_winrate: number; p1_a_avg: number; p1_a_cumul: number;
  p1_n_count: number; p1_n_winrate: number; p1_n_avg: number; p1_n_cumul: number;
  p1_total_count: number; p1_total_winrate: number; p1_total_cumul: number;
  // ETC
  etc_ss_count: number; etc_ss_winrate: number; etc_ss_avg: number; etc_ss_cumul: number;
  etc_s_count: number; etc_s_winrate: number; etc_s_avg: number; etc_s_cumul: number;
  etc_a_count: number; etc_a_winrate: number; etc_a_avg: number; etc_a_cumul: number;
  etc_total_count: number; etc_total_winrate: number; etc_total_cumul: number;
  // Grand
  grand_total_count: number; grand_total_winrate: number; grand_total_cumul: number;
}

const COLORS = {
  amber: '#f59e0b',
  emerald: '#10b981',
  blue: '#3b82f6',
  rose: '#f43f5e',
  purple: '#a855f7',
  cyan: '#06b6d4',
  orange: '#f97316',
};

const GRADE_COLORS: Record<string, string> = {
  SS: '#f43f5e',
  S: '#f59e0b',
  A: '#3b82f6',
  N: '#6b7280',
};

// Custom Tooltip component
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1 text-sm font-medium text-white">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%</span>
        </p>
      ))}
    </div>
  );
}

function CustomTooltipWithUnit({ active, payload, label, unit = '%' }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string; unit?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1 text-sm font-medium text-white">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}{unit}</span>
        </p>
      ))}
    </div>
  );
}

export default function SimulationPage() {
  const [data, setData] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/simulation-summary');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch {
        setError('데이터를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-3 text-zinc-400">시뮬레이션 데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-12 text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-zinc-600" />
        <h3 className="mt-4 text-lg font-medium text-zinc-400">{error || '데이터가 없습니다'}</h3>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // ── Chart Data ──



  // 2. P0 등급별 상세
  const p0Grades = [
    { name: 'S등급', winrate: Number(data.p0_s_winrate), avg: Number(data.p0_s_avg), cumul: Number(data.p0_s_cumul), count: data.p0_s_count },
    { name: 'N등급', winrate: Number(data.p0_n_winrate), avg: Number(data.p0_n_avg), cumul: Number(data.p0_n_cumul), count: data.p0_n_count },
  ];

  // 3. P1 등급별 상세
  const p1Grades = [
    { name: 'S등급', winrate: Number(data.p1_s_winrate), avg: Number(data.p1_s_avg), cumul: Number(data.p1_s_cumul), count: data.p1_s_count },
    { name: 'A등급', winrate: Number(data.p1_a_winrate), avg: Number(data.p1_a_avg), cumul: Number(data.p1_a_cumul), count: data.p1_a_count },
    { name: 'N등급', winrate: Number(data.p1_n_winrate), avg: Number(data.p1_n_avg), cumul: Number(data.p1_n_cumul), count: data.p1_n_count },
  ];

  // 4. ETC 등급별 상세
  const etcGrades = [
    { name: 'SS등급', winrate: Number(data.etc_ss_winrate), avg: Number(data.etc_ss_avg), cumul: Number(data.etc_ss_cumul), count: data.etc_ss_count },
    { name: 'S등급', winrate: Number(data.etc_s_winrate), avg: Number(data.etc_s_avg), cumul: Number(data.etc_s_cumul), count: data.etc_s_count },
    { name: 'A등급', winrate: Number(data.etc_a_winrate), avg: Number(data.etc_a_avg), cumul: Number(data.etc_a_cumul), count: data.etc_a_count },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-amber-500/10 p-2 text-amber-500 ring-1 ring-amber-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            시뮬레이션
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-zinc-400">
          트레이딩 패턴별 시뮬레이션 백테스트 결과를 시각화합니다. 데이터가 갱신되면 자동으로 최신 결과를 표시합니다.
        </p>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-white/5 px-3 py-1.5 rounded-md w-fit border border-white/10">
          <Clock className="h-3.5 w-3.5" />
          <span>마지막 업데이트: {formatDate(data.run_at)}</span>
        </div>
      </header>

      {/* ── Grand Total Summary Cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-500">총 거래 수</p>
          <p className="mt-1 text-3xl font-bold text-white">{data.grand_total_count}<span className="text-base font-normal text-zinc-500 ml-1">건</span></p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-500">전체 승률</p>
          <p className="mt-1 text-3xl font-bold text-amber-500">{Number(data.grand_total_winrate).toFixed(1)}<span className="text-base font-normal text-zinc-500 ml-1">%</span></p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-500">총 누적수익</p>
          <p className="mt-1 text-3xl font-bold text-emerald-500">+{Number(data.grand_total_cumul).toFixed(1)}<span className="text-base font-normal text-zinc-500 ml-1">%</span></p>
        </div>
      </div>

      {/* ── Chart 3: 등급별 상세 (3-in-1) ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* P0 등급별 */}
        <GradeDetailChart
          title="P0 전강후약"
          subtitle="등급별 상세"
          data={p0Grades}
          accentColor={COLORS.amber}
        />

        {/* P1 등급별 */}
        <GradeDetailChart
          title="P1 지속 우상향"
          subtitle="등급별 상세"
          data={p1Grades}
          accentColor={COLORS.emerald}
        />

        {/* ETC 등급별 */}
        <GradeDetailChart
          title="기타/변동형"
          subtitle="등급별 상세"
          data={etcGrades}
          accentColor={COLORS.blue}
        />
      </div>

      {/* ── 패턴별 등급 요약 테이블 ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GradeSummaryTable
          title="P0 전강후약"
          grades={p0Grades}
          total={{ count: data.p0_total_count, winrate: Number(data.p0_total_winrate), cumul: Number(data.p0_total_cumul) }}
          accentColor={COLORS.amber}
        />
        <GradeSummaryTable
          title="P1 지속 우상향"
          grades={p1Grades}
          total={{ count: data.p1_total_count, winrate: Number(data.p1_total_winrate), cumul: Number(data.p1_total_cumul) }}
          accentColor={COLORS.emerald}
        />
        <GradeSummaryTable
          title="기타/변동형"
          grades={etcGrades}
          total={{ count: data.etc_total_count, winrate: Number(data.etc_total_winrate), cumul: Number(data.etc_total_cumul) }}
          accentColor={COLORS.blue}
        />
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/5 bg-zinc-900/20 p-4 text-xs text-zinc-600">
        ⚠️ 본 시뮬레이션 데이터는 과거 백테스트 결과이며, 실제 투자 수익을 보장하지 않습니다.
        투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.
      </div>
    </div>
  );
}

// ── Sub Components ──

function GradeDetailChart({
  title,
  subtitle,
  data,
  accentColor,
}: {
  title: string;
  subtitle: string;
  data: Array<{ name: string; winrate: number; avg: number; cumul: number; count: number }>;
  accentColor: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
      <div className="mb-4">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
            <YAxis yAxisId="left" stroke={accentColor} fontSize={11} tickLine={false} unit="%" />
            <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" fontSize={11} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltipWithUnit />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value: string) => <span className="text-zinc-400">{value}</span>}
            />
            <Bar yAxisId="left" dataKey="winrate" name="승률(%)" fill={accentColor} fillOpacity={0.9} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="cumul" name="누적수익(%)" fill="#8b5cf6" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GradeSummaryTable({
  title,
  grades,
  total,
  accentColor,
}: {
  title: string;
  grades: Array<{ name: string; winrate: number; avg: number; cumul: number; count: number }>;
  total: { count: number; winrate: number; cumul: number };
  accentColor: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
      <div className="border-b border-white/10 px-5 py-3" style={{ borderTopColor: accentColor, borderTopWidth: '2px' }}>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="divide-y divide-white/5">
        {/* Header row */}
        <div className="grid grid-cols-5 gap-1 px-5 py-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          <span>등급</span>
          <span className="text-right">건수</span>
          <span className="text-right">승률</span>
          <span className="text-right">평균</span>
          <span className="text-right">누적</span>
        </div>
        {/* Data rows */}
        {grades.map((g) => (
          <div key={g.name} className="grid grid-cols-5 gap-1 px-5 py-2.5 text-sm hover:bg-white/5 transition-colors">
            <span className="font-medium text-zinc-300">{g.name}</span>
            <span className="text-right text-zinc-400">{g.count}건</span>
            <span className={`text-right font-medium ${g.winrate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {g.winrate.toFixed(1)}%
            </span>
            <span className={`text-right ${g.avg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {g.avg >= 0 ? '+' : ''}{g.avg.toFixed(2)}%
            </span>
            <span className={`text-right font-medium ${g.cumul >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {g.cumul >= 0 ? '+' : ''}{g.cumul.toFixed(1)}%
            </span>
          </div>
        ))}
        {/* Total row */}
        <div className="grid grid-cols-5 gap-1 px-5 py-2.5 text-sm bg-white/[0.03] font-medium">
          <span className="text-white">합계</span>
          <span className="text-right text-white">{total.count}건</span>
          <span className={`text-right ${total.winrate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {total.winrate.toFixed(1)}%
          </span>
          <span className="text-right text-zinc-500">—</span>
          <span className={`text-right ${total.cumul >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {total.cumul >= 0 ? '+' : ''}{total.cumul.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
