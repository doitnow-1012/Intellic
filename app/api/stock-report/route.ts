/**
 * 증권사 리포트 요약 API
 * POST /api/stock-report
 * Body: { stockName: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveStock } from '@/lib/stock-map';
import { generateStockReport } from '@/lib/naver-research';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stockName } = body;

    if (!stockName || typeof stockName !== 'string') {
      return NextResponse.json(
        { error: '종목명 또는 종목코드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 1. 종목명 → 종목코드 변환
    const stock = resolveStock(stockName.trim());
    if (!stock) {
      return NextResponse.json(
        { error: `'${stockName}'에 해당하는 종목을 찾을 수 없습니다. 정확한 종목명 또는 6자리 종목코드를 입력해주세요.` },
        { status: 404 }
      );
    }

    // 2. 리포트 수집 + AI 요약
    const result = await generateStockReport(stock.code, stock.name);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[stock-report API] Error:', error);
    return NextResponse.json(
      { error: '리포트 수집 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
