'use client';

import { useState, useEffect } from 'react';
import { AdSense } from '@/components/AdSense';
import { ArrowLeft, Calendar, Loader2, Tag, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ImageUrlEntry {
  placeholder: string;
  url: string;
  prompt?: string;
}

interface ColumnDetail {
  id: string;
  title: string;
  summary: string;
  content_md: string;
  category: string;
  tags: string[];
  slug: string;
  cover_image_url: string | null;
  image_urls: ImageUrlEntry[] | null;
  meta_description: string | null;
  created_at: string;
}

export default function ColumnDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [report, setReport] = useState<ColumnDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchColumn() {
      setLoading(true);
      try {
        const res = await fetch(`/api/columns/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error fetching column:', err);
        setNotFound(true);
      }
      setLoading(false);
    }
    if (slug) fetchColumn();
  }, [slug]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`;
  };

  // 본문 내 이미지 플레이스홀더를 실제 마크다운 이미지로 치환
  const processContent = (content: string, imageUrls: ImageUrlEntry[] | null): string => {
    if (!imageUrls || imageUrls.length === 0) return content;
    let processed = content;
    for (const img of imageUrls) {
      const placeholder = `[${img.placeholder}]`;
      const caption = img.prompt ? img.prompt.slice(0, 100) : 'image';
      const mdImg = `\n\n![${caption}](${img.url})\n\n`;
      processed = processed.replace(placeholder, mdImg);
    }
    return processed;
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-3 text-zinc-400">칼럼을 불러오는 중...</span>
      </div>
    );
  }

  // Not found
  if (notFound || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <BookOpen className="h-16 w-16 text-zinc-700" />
        <h2 className="mt-6 text-xl font-semibold text-zinc-400">칼럼을 찾을 수 없습니다</h2>
        <p className="mt-2 text-sm text-zinc-500">요청하신 칼럼이 존재하지 않거나 삭제되었습니다.</p>
        <Link
          href="/featured-stocks"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-500 ring-1 ring-amber-500/20 transition-colors hover:bg-amber-500/20"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const processedContent = processContent(report.content_md, report.image_urls);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back button */}
      <Link
        href="/featured-stocks"
        className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-amber-500"
      >
        <ArrowLeft className="h-4 w-4" />
        경제칼럼 목록
      </Link>

      {/* Hero Section */}
      <header className="relative mb-10 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/50">
        {/* Cover Image */}
        {report.cover_image_url && (
          <div className="relative h-64 sm:h-80 w-full overflow-hidden">
            <img
              src={report.cover_image_url}
              alt={report.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
          </div>
        )}

        <div className={`relative px-6 sm:px-8 pb-8 ${report.cover_image_url ? '-mt-24 pt-0' : 'pt-8'}`}>
          {/* Category */}
          {report.category && (
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-amber-400 ring-1 ring-amber-500/30">
              <Tag className="h-3 w-3" />
              {report.category}
            </span>
          )}

          {/* Title */}
          <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-white">
            {report.title}
          </h1>

          {/* Summary */}
          {report.summary && (
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-zinc-400">
              {report.summary}
            </p>
          )}

          {/* Meta info */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(report.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              📖 Gemini Deep Research
            </span>
            <span className="flex items-center gap-1.5">
              🤖 AI Generated Column
            </span>
          </div>

          {/* Tags */}
          {report.tags && report.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {report.tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400 ring-1 ring-white/10 transition-colors hover:ring-amber-500/30 hover:text-amber-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* AdSense */}
      <AdSense />

      {/* Article Body */}
      <article className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 md:p-10 shadow-xl">
        <div className="prose prose-invert prose-zinc max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pl-4 prose-h2:border-l-[3px] prose-h2:border-amber-500
          prose-h3:text-lg prose-h3:sm:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-zinc-200
          prose-p:text-zinc-300 prose-p:leading-relaxed
          prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline prose-a:transition-colors
          prose-strong:text-white prose-strong:font-semibold
          prose-ul:my-4 prose-li:text-zinc-300 prose-li:marker:text-amber-500/60
          prose-ol:my-4
          prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-img:shadow-lg
          prose-blockquote:border-l-amber-500 prose-blockquote:bg-white/5 prose-blockquote:rounded-r-lg prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:text-zinc-400
          prose-table:border-white/10 prose-th:bg-white/5 prose-th:px-3 prose-th:py-2.5 prose-th:text-sm prose-th:font-semibold prose-th:text-zinc-300
          prose-td:px-3 prose-td:py-2.5 prose-td:text-sm prose-td:border-t prose-td:border-white/10
          prose-code:text-amber-400 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
          prose-hr:border-white/10
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {processedContent}
          </ReactMarkdown>
        </div>
      </article>

      {/* AdSense bottom */}
      <div className="mt-8">
        <AdSense />
      </div>

      {/* Footer */}
      <footer className="mt-10 mb-8 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-4 text-center">
        <p className="text-xs text-zinc-600">
          Intellic — AI Research Column | Powered by Gemini 2.5 Flash + Imagen 4
        </p>
      </footer>

      {/* Back to list */}
      <div className="mb-12 text-center">
        <Link
          href="/featured-stocks"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-5 py-2.5 text-sm font-medium text-amber-500 ring-1 ring-amber-500/20 transition-all hover:bg-amber-500/20 hover:ring-amber-500/40"
        >
          <ArrowLeft className="h-4 w-4" />
          다른 칼럼 보기
        </Link>
      </div>
    </div>
  );
}
