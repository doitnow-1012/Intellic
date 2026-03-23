'use client';

import { useState, useEffect } from 'react';
import { AdSense } from '@/components/AdSense';
import { ArrowRight, Newspaper, Loader2, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';

interface ColumnReport {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  slug: string;
  cover_image_url: string | null;
  created_at: string;
}

export default function FeaturedStocksPage() {
  const [reports, setReports] = useState<ColumnReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchColumns() {
      setLoading(true);
      try {
        const res = await fetch('/api/columns');
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } catch (err) {
        console.error('Error fetching columns:', err);
      }
      setLoading(false);
    }
    fetchColumns();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-amber-500/10 p-2 text-amber-500 ring-1 ring-amber-500/20">
            <Newspaper className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            경제칼럼
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-zinc-400">
          Gemini Deep Research 기반 AI가 분석한 경제·산업 심층 칼럼입니다.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-md w-fit border border-purple-500/20">
            <span>🤖 Gemini 2.5 Flash + Imagen 4</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-md w-fit border border-amber-500/20">
            <span>📖 AI Generated Column</span>
          </div>
        </div>
      </header>

      <AdSense />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <span className="ml-3 text-zinc-400">칼럼을 불러오는 중...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && reports.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-12 text-center">
          <Newspaper className="mx-auto h-12 w-12 text-zinc-600" />
          <h3 className="mt-4 text-lg font-medium text-zinc-400">아직 작성된 칼럼이 없습니다</h3>
          <p className="mt-2 text-sm text-zinc-500">딥리서치 파이프라인을 실행하여 칼럼을 생성하세요.</p>
        </div>
      )}

      {/* Column Cards */}
      {!loading && reports.length > 0 && (
        <div className="grid gap-6">
          {reports.map((report, idx) => (
            <Link
              key={report.id}
              href={`/featured-stocks/${report.slug}`}
              className="group block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 transition-all duration-300 hover:border-amber-500/40 hover:bg-zinc-900 hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div>
                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    {/* Category & Date */}
                    <div className="flex items-center gap-3 mb-3">
                      {report.category && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500 ring-1 ring-amber-500/20">
                          <Tag className="h-3 w-3" />
                          {report.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300 leading-snug">
                      {report.title}
                    </h2>

                    {/* Summary */}
                    <p className="mt-3 text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                      {report.summary}
                    </p>

                    {/* Tags */}
                    {report.tags && report.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {report.tags.slice(0, 5).map((tag, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-zinc-500 ring-1 ring-white/10"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Read more */}
                  <div className="mt-5 flex items-center text-sm font-medium text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    칼럼 읽기 <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
