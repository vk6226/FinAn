import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

const USD_TO_INR = 83.5; // Fixed conversion rate for presentation

async function fetchCompanyData(ticker: string) {
  try {
    const [quote, summary] = await Promise.allSettled([
      yahooFinance.quote(ticker),
      yahooFinance.quoteSummary(ticker, {
        modules: ['summaryProfile', 'financialData', 'defaultKeyStatistics'],
      }),
    ]);
    return {
      quote: quote.status === 'fulfilled' ? (quote.value as any) : null,
      summary: summary.status === 'fulfilled' ? (summary.value as any) : null,
    };
  } catch (err) {
    return null;
  }
}

function formatFinancialData(data: any, ticker: string): string {
  if (!data || (!data.quote && !data.summary)) return `No data found for ${ticker}.`;
  
  const q = data.quote;
  const s = data.summary;
  const lines: string[] = [];
  
  // Detection for conversion
  const isUSD = q?.currency === 'USD';
  const convert = (val: number | undefined) => {
    if (val === undefined || val === null) return 'N/A';
    const finalVal = isUSD ? val * USD_TO_INR : val;
    if (finalVal > 1e9) return `₹${(finalVal / 1e9).toFixed(2)}B`;
    if (finalVal > 1e7) return `₹${(finalVal / 1e7).toFixed(2)} Cr`;
    return `₹${finalVal.toLocaleString()}`;
  };

  if (q) {
    lines.push(`## ${q.longName || q.shortName || ticker} (${ticker.toUpperCase()})`);
    lines.push(`Current Price: ${convert(q.regularMarketPrice)}`);
    lines.push(`Market Cap: ${convert(q.marketCap)}`);
    if (isUSD) lines.push(`(Converted from USD at ${USD_TO_INR} rate)`);
  }
  
  if (s?.financialData) {
    const fd = s.financialData;
    lines.push(`Revenue (TTM): ${convert(fd.totalRevenue)}`);
    lines.push(`EBITDA: ${convert(fd.ebitda)}`);
    lines.push(`Margins: ${fd.operatingMargins ? (fd.operatingMargins * 100).toFixed(1) + '%' : 'N/A'}`);
  }
  
  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;
    const apiKey = process.env.MISTRAL_API_KEY;

    const companyToTicker: Record<string, string> = {
      apple: 'AAPL', microsoft: 'MSFT', google: 'GOOGL', tesla: 'TSLA', nvidia: 'NVDA',
      patanjali: 'PATANJALI.NS', reliance: 'RELIANCE.NS', tcs: 'TCS.NS', infosys: 'INFY.NS',
      zomato: 'ZOMATO.NS', hdfc: 'HDFCBANK.NS', adani: 'ADANIENT.NS'
    };

    let resolvedTicker = '';
    const cleanWords = message.toLowerCase().replace(/[?!.,]/g, '').split(/\s+/);
    for (const word of cleanWords) {
      if (companyToTicker[word]) { resolvedTicker = companyToTicker[word]; break; }
      if (word.includes('.')) resolvedTicker = word.toUpperCase();
    }

    let financialContext = '';
    if (resolvedTicker) {
      const data = await fetchCompanyData(resolvedTicker);
      financialContext = formatFinancialData(data, resolvedTicker);
    }

    const systemPrompt = `You are FinAn AI.
CONTEXT DATA (ALL VALUES IN RUPEES ₹):
${financialContext || 'No real-time data found.'}

INSTRUCTIONS:
- Report all monetary values in Indian Rupees (₹).
- Use Cr (Crores) or B (Billions) for large figures as provided in context.
- Mention "Yahoo Finance (Live)" for specific data points.`;

    const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'open-mistral-7b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(history || []).map((h: any) => ({
            role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
            content: h.parts?.[0]?.text || h.content || ''
          })).slice(-6),
          { role: 'user', content: message }
        ],
      }),
    });

    const data = await mistralRes.json();
    return NextResponse.json({ 
      response: data.choices[0].message.content,
      ticker: resolvedTicker,
      hasLiveData: !!financialContext
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
