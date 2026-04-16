import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

// ── Styles ──
const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1d1d1f' },
  coverPage: { padding: 0, fontFamily: 'Helvetica' },

  // Cover
  coverBg: { backgroundColor: '#0a0a0a', height: '100%', padding: 60, justifyContent: 'flex-end' },
  coverBrand: { fontSize: 48, fontWeight: 'bold', color: '#2997ff', marginBottom: 8, fontFamily: 'Helvetica-Bold' },
  coverTitle: { fontSize: 28, color: '#ffffff', marginBottom: 12, fontFamily: 'Helvetica-Bold' },
  coverSub: { fontSize: 14, color: '#86868b', marginBottom: 40 },
  coverMeta: { fontSize: 10, color: '#48484a', marginTop: 'auto' },
  coverConfidential: { fontSize: 9, color: '#ff453a', marginTop: 12, textTransform: 'uppercase' as any, letterSpacing: 2 },

  // Section Headers
  sectionTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', color: '#1d1d1f', marginBottom: 16, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#2997ff' },
  subTitle: { fontSize: 12, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', color: '#48484a', textTransform: 'uppercase' as any, letterSpacing: 1, marginBottom: 10, marginTop: 16 },

  // Executive Summary
  summaryText: { fontSize: 10, lineHeight: 1.7, color: '#3a3a3c', marginBottom: 12, textAlign: 'justify' as any },

  // Tables
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f7', borderBottomWidth: 1, borderBottomColor: '#d2d2d7', paddingVertical: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e8e8ed', paddingVertical: 5 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e8e8ed', paddingVertical: 5, backgroundColor: '#fafafa' },
  tableCellLabel: { flex: 2, fontSize: 9, color: '#48484a', paddingHorizontal: 8 },
  tableCellValue: { flex: 1, fontSize: 9, color: '#1d1d1f', fontFamily: 'Helvetica-Bold', textAlign: 'right' as any, paddingHorizontal: 8 },
  tableHeaderLabel: { flex: 2, fontSize: 8, color: '#86868b', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' as any, letterSpacing: 1, paddingHorizontal: 8 },
  tableHeaderValue: { flex: 1, fontSize: 8, color: '#86868b', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' as any, letterSpacing: 1, textAlign: 'right' as any, paddingHorizontal: 8 },

  // Chart Container
  chartImage: { width: '100%', height: 220, marginBottom: 20, objectFit: 'contain' as any },
  chartRow: { flexDirection: 'row', gap: 16 },
  chartHalf: { flex: 1 },

  // Footer
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, fontSize: 7, color: '#86868b', flexDirection: 'row', justifyContent: 'space-between' },

  // Verdict Box
  verdictBox: { backgroundColor: '#f0f8ff', borderWidth: 1, borderColor: '#2997ff', borderRadius: 6, padding: 14, marginTop: 12 },
  verdictTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#2997ff', marginBottom: 6 },
  verdictText: { fontSize: 9, lineHeight: 1.6, color: '#1d1d1f' },

  // Disclaimer
  disclaimerPage: { padding: 60, justifyContent: 'center' },
  disclaimerTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#86868b', marginBottom: 20 },
  disclaimerText: { fontSize: 8, lineHeight: 1.8, color: '#86868b' },
});

// ── Helper Components ──
function TableRow({ label, value, alt }: { label: string; value: string; alt?: boolean }) {
  return (
    <View style={alt ? s.tableRowAlt : s.tableRow}>
      <Text style={s.tableCellLabel}>{label}</Text>
      <Text style={s.tableCellValue}>{value}</Text>
    </View>
  );
}

function PageFooter({ page, title }: { page: number; title: string }) {
  return (
    <View style={s.footer}>
      <Text>FinAn Enterprise Platform — {title}</Text>
      <Text>Page {page} | Confidential</Text>
    </View>
  );
}

// ── Main PDF Document ──
interface ReportPDFProps {
  report: { title: string; companyA: string; companyB: string; createdAt: Date; analyst: { name: string } };
  dcfData: any;
  maData: any;
  summary: string;
  charts: {
    dcfWaterfall: Buffer;
    fcfBar: Buffer;
    dealPie: Buffer;
    epsAccretion: Buffer;
  };
}

export function ReportPDF({ report, dcfData, maData, summary, charts }: ReportPDFProps) {
  const summaryParagraphs = summary.split('\n\n');
  const recommendation = summaryParagraphs.pop() || '';

  return (
    <Document>
      {/* ════════════════════════
          PAGE 1: COVER PAGE
          ════════════════════════ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverBg}>
          <Text style={s.coverBrand}>FinAn</Text>
          <Text style={s.coverTitle}>{report.title}</Text>
          <Text style={s.coverSub}>Comprehensive Financial Analysis &amp; Valuation Report</Text>
          <View style={{ marginTop: 40 }}>
            <Text style={s.coverMeta}>Prepared by: {report.analyst.name}</Text>
            <Text style={s.coverMeta}>Date: {new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            <Text style={s.coverMeta}>Acquirer: {report.companyA}  |  Target: {report.companyB}</Text>
          </View>
          <Text style={s.coverConfidential}>Strictly Confidential — For Internal Use Only</Text>
        </View>
      </Page>

      {/* ════════════════════════
          PAGE 2: EXECUTIVE SUMMARY
          ════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Executive Summary</Text>
        {summaryParagraphs.map((p, i) => (
          <Text key={i} style={s.summaryText}>{p}</Text>
        ))}
        <View style={s.verdictBox}>
          <Text style={s.verdictTitle}>Analyst Recommendation</Text>
          <Text style={s.verdictText}>{recommendation}</Text>
        </View>
        <PageFooter page={2} title={report.title} />
      </Page>

      {/* ════════════════════════
          PAGE 3: DCF VALUATION
          ════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>DCF Valuation — {report.companyA}</Text>

        <Text style={s.subTitle}>Key Assumptions</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.tableHeaderLabel}>Parameter</Text>
            <Text style={s.tableHeaderValue}>Value</Text>
          </View>
          <TableRow label="WACC" value={`${dcfData.wacc?.toFixed(1)}%`} />
          <TableRow label="Terminal Growth Rate" value={`${dcfData.tgr?.toFixed(1)}%`} alt />
          <TableRow label="Revenue Growth Rate" value={`${dcfData.revenueGrowth?.toFixed(1)}%`} />
          <TableRow label="EBITDA Margin" value={`${dcfData.ebitdaMargin?.toFixed(1)}%`} alt />
          <TableRow label="Tax Rate" value={`${dcfData.taxRate?.toFixed(1)}%`} />
          <TableRow label="Projection Period" value={`${dcfData.projectionYears} years`} alt />
        </View>

        <Text style={s.subTitle}>Valuation Output</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.tableHeaderLabel}>Metric</Text>
            <Text style={s.tableHeaderValue}>Value</Text>
          </View>
          <TableRow label="PV of Projected FCFs" value={`$${dcfData.pvOfFCFs?.toLocaleString()}M`} />
          <TableRow label="Terminal Value" value={`$${dcfData.terminalValue?.toLocaleString()}M`} alt />
          <TableRow label="PV of Terminal Value" value={`$${dcfData.pvTerminal?.toLocaleString()}M`} />
          <TableRow label="Enterprise Value" value={`$${dcfData.enterpriseValue?.toLocaleString()}M`} alt />
          <TableRow label="Equity Value" value={`$${dcfData.equityValue?.toLocaleString()}M`} />
          <TableRow label="Implied Share Price" value={`$${dcfData.impliedSharePrice?.toFixed(2)}`} alt />
          <TableRow label="Upside / Downside" value={`${dcfData.upside > 0 ? '+' : ''}${dcfData.upside?.toFixed(1)}%`} />
        </View>

        <Image src={{ data: charts.dcfWaterfall, format: 'png' }} style={s.chartImage} />
        <PageFooter page={3} title={report.title} />
      </Page>

      {/* ════════════════════════
          PAGE 4: PROJECTED FCFs
          ════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Projected Free Cash Flows</Text>

        <Text style={s.subTitle}>Year-by-Year Projections</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.tableHeaderLabel}>Year</Text>
            <Text style={s.tableHeaderValue}>FCF ($M)</Text>
          </View>
          {(dcfData.projectedFCFs || []).map((fcf: number, i: number) => (
            <TableRow key={i} label={`Year ${i + 1}`} value={`$${fcf?.toFixed(0)?.toLocaleString()}`} alt={i % 2 === 1} />
          ))}
        </View>

        <Image src={{ data: charts.fcfBar, format: 'png' }} style={s.chartImage} />
        <PageFooter page={4} title={report.title} />
      </Page>

      {/* ════════════════════════
          PAGE 5: M&A ANALYSIS
          ════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>M&amp;A Analysis — Deal Structure</Text>

        <Text style={s.subTitle}>Deal Terms</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.tableHeaderLabel}>Metric</Text>
            <Text style={s.tableHeaderValue}>Value</Text>
          </View>
          <TableRow label="Offer Price / Share" value={`$${maData.offerPrice?.toFixed(2)}`} />
          <TableRow label="Offer Premium" value={`${maData.dealPremium?.toFixed(0)}%`} alt />
          <TableRow label="Target Equity Value" value={`$${maData.targetEquityValue?.toLocaleString()}M`} />
          <TableRow label="Total Deal Value (incl. debt)" value={`$${maData.totalDealValue?.toLocaleString()}M`} alt />
          <TableRow label="Cash Component" value={`$${maData.cashComponent?.toLocaleString()}M`} />
          <TableRow label="Stock Component" value={`$${maData.stockComponent?.toLocaleString()}M`} alt />
          <TableRow label="New Shares Issued" value={`${maData.newSharesIssued?.toFixed(1)}M`} />
          <TableRow label="Target EV/EBITDA" value={`${maData.companyB_evEbitda?.toFixed(1)}x`} alt />
        </View>

        <Image src={{ data: charts.dealPie, format: 'png' }} style={{ width: 300, height: 200, alignSelf: 'center' as any, marginVertical: 12 }} />
        <PageFooter page={5} title={report.title} />
      </Page>

      {/* ════════════════════════
          PAGE 6: ACCRETION / DILUTION
          ════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Accretion / Dilution &amp; Pro-Forma</Text>

        <Text style={s.subTitle}>Pro-Forma Combined Financials</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.tableHeaderLabel}>Metric</Text>
            <Text style={s.tableHeaderValue}>Value</Text>
          </View>
          <TableRow label="Combined Revenue" value={`$${maData.combinedRevenue?.toLocaleString()}M`} />
          <TableRow label="Combined EBITDA" value={`$${maData.combinedEbitda?.toLocaleString()}M`} alt />
          <TableRow label="Combined Net Income" value={`$${maData.combinedNetIncome?.toLocaleString()}M`} />
          <TableRow label="Total Shares Outstanding" value={`${maData.combinedShares?.toFixed(1)}M`} alt />
          <TableRow label="Cost Synergies" value={`$${maData.costSynergies?.toLocaleString()}M`} />
          <TableRow label="Revenue Synergies" value={`$${maData.revenueSynergies?.toLocaleString()}M`} alt />
          <TableRow label="Integration Costs" value={`$${maData.integrationCosts?.toLocaleString()}M`} />
        </View>

        <Text style={s.subTitle}>EPS Impact</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.tableHeaderLabel}>Metric</Text>
            <Text style={s.tableHeaderValue}>Value</Text>
          </View>
          <TableRow label="Standalone EPS (Acquirer)" value={`$${dcfData.companyA_eps?.toFixed(2)}`} />
          <TableRow label="Pro-Forma EPS (Combined)" value={`$${maData.proFormaEPS?.toFixed(2)}`} alt />
          <TableRow label="Accretion / Dilution" value={`${maData.accretionDilution > 0 ? '+' : ''}${maData.accretionDilution?.toFixed(2)}%`} />
        </View>

        <Image src={{ data: charts.epsAccretion, format: 'png' }} style={s.chartImage} />
        <PageFooter page={6} title={report.title} />
      </Page>

      {/* ════════════════════════
          PAGE 7: DISCLAIMER
          ════════════════════════ */}
      <Page size="A4" style={s.disclaimerPage}>
        <Text style={s.disclaimerTitle}>Important Disclaimer</Text>
        <Text style={s.disclaimerText}>
          This report has been prepared by FinAn Enterprise Platform for internal use only. The financial models, projections, and analyses contained herein are based on assumptions and estimates that may not reflect actual future performance. All projected financial data, including but not limited to free cash flows, synergy estimates, and accretion/dilution analyses, are subject to significant uncertainty and should not be construed as guarantees of future results.
        </Text>
        <Text style={[s.disclaimerText, { marginTop: 12 }]}>
          This document is strictly confidential and is intended solely for the use of authorized personnel within the organization. Any unauthorized reproduction, distribution, or disclosure of this material is strictly prohibited. The information provided does not constitute financial advice, and any investment decisions should be made in consultation with qualified financial advisors.
        </Text>
        <Text style={[s.disclaimerText, { marginTop: 12 }]}>
          © {new Date().getFullYear()} FinAn Enterprise Platform. All rights reserved.
        </Text>
      </Page>
    </Document>
  );
}
