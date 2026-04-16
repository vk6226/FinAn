import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportPDF } from '@/lib/pdfTemplate';
import { generateExecutiveSummary } from '@/lib/executiveSummary';
import {
  generateDCFWaterfallChart,
  generateFCFBarChart,
  generateDealStructurePie,
  generateAccretionChart,
} from '@/lib/charts';
import React from 'react';

// Force Node.js runtime so chartjs-node-canvas (which uses canvas) works
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch report from DB (Prisma / SQLite)
    const report = await db.report.findUnique({
      where: { id },
      include: { analyst: true },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const dcfData = JSON.parse(report.dcfData);
    const maData  = JSON.parse(report.maData);

    // 2. Generate all 4 charts in parallel via Chart.js (server-side canvas)
    const [dcfWaterfall, fcfBar, dealPie, epsAccretion] = await Promise.all([
      generateDCFWaterfallChart(dcfData),
      generateFCFBarChart(dcfData),
      generateDealStructurePie(maData),
      generateAccretionChart(dcfData, maData),
    ]);

    // 3. Build executive summary text
    const summary = generateExecutiveSummary(dcfData, maData, {
      companyA: report.companyA,
      companyB: report.companyB,
    });

    // 4. Render the 7-page React-PDF document to a buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(ReportPDF, {
        report: {
          title:     report.title,
          companyA:  report.companyA,
          companyB:  report.companyB,
          createdAt: report.createdAt,
          analyst:   { name: report.analyst?.name ?? 'FinAn Analyst' },
        },
        dcfData,
        maData,
        summary,
        charts: { dcfWaterfall, fcfBar, dealPie, epsAccretion },
      })
    );

    // 5. Stream back as a downloadable PDF
    const filename = `FinAn_${report.companyA}_${report.companyB}_Report.pdf`
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(pdfBuffer.byteLength),
      },
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}
