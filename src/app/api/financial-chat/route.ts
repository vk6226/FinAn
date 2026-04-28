import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function fetchCompanyData(ticker: string) {
  try {
    const [quote, summary, financials] = await Promise.allSettled([
      yahooFinance.quote(ticker),
      yahooFinance.quoteSummary(ticker, {
        modules: ['summaryProfile', 'financialData', 'defaultKeyStatistics', 'incomeStatementHistory', 'balanceSheetHistory', 'cashflowStatementHistory'],
      }),
      yahooFinance.quoteSummary(ticker, {
        modules: ['earnings'],
      }),
    ]);

    return {
      quote: quote.status === 'fulfilled' ? quote.value : null,
      summary: summary.status === 'fulfilled' ? summary.value : null,
      earnings: financials.status === 'fulfilled' ? financials.value : null,
    };
  } catch (err) {
    return null;
  }
}

function formatFinancialData(data: any, ticker: string): string {
  if (!data) return `No data found for ${ticker}.`;

  const q = data.quote;
  const s = data.summary;

  const lines: string[] = [];

  if (q) {
    lines.push(`## ${q.longName || q.shortName || ticker} (${ticker.toUpperCase()})`);
    lines.push(`Exchange: ${q.exchange || 'N/A'} | Currency: ${q.currency || 'N/A'}`);
    lines.push(`\n### Price Data`);
    lines.push(`Current Price: $${q.regularMarketPrice ?? 'N/A'}`);
    lines.push(`52-Week High: $${q.fiftyTwoWeekHigh ?? 'N/A'} | Low: $${q.fiftyTwoWeekLow ?? 'N/A'}`);
    lines.push(`Market Cap: $${q.marketCap ? (q.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}`);
    lines.push(`Volume: ${q.regularMarketVolume?.toLocaleString() ?? 'N/A'}`);
  }

  if (s?.financialData) {
    const fd = s.financialData;
    lines.push(`\n### Financial Metrics`);
    lines.push(`Revenue (TTM): $${fd.totalRevenue ? (fd.totalRevenue / 1e9).toFixed(2) + 'B' : 'N/A'}`);
    lines.push(`Gross Profit: $${fd.grossProfits ? (fd.grossProfits / 1e9).toFixed(2) + 'B' : 'N/A'}`);
    lines.push(`EBITDA: $${fd.ebitda ? (fd.ebitda / 1e9).toFixed(2) + 'B' : 'N/A'}`);
    lines.push(`Free Cash Flow: $${fd.freeCashflow ? (fd.freeCashflow / 1e9).toFixed(2) + 'B' : 'N/A'}`);
    lines.push(`Operating Margins: ${fd.operatingMargins ? (fd.operatingMargins * 100).toFixed(1) + '%' : 'N/A'}`);
    lines.push(`Profit Margins: ${fd.profitMargins ? (fd.profitMargins * 100).toFixed(1) + '%' : 'N/A'}`);
    lines.push(`Return on Equity: ${fd.returnOnEquity ? (fd.returnOnEquity * 100).toFixed(1) + '%' : 'N/A'}`);
    lines.push(`Return on Assets: ${fd.returnOnAssets ? (fd.returnOnAssets * 100).toFixed(1) + '%' : 'N/A'}`);
    lines.push(`Debt/Equity: ${fd.debtToEquity ?? 'N/A'}`);
    lines.push(`Current Ratio: ${fd.currentRatio ?? 'N/A'}`);
    lines.push(`Total Cash: $${fd.totalCash ? (fd.totalCash / 1e9).toFixed(2) + 'B' : 'N/A'}`);
    lines.push(`Total Debt: $${fd.totalDebt ? (fd.totalDebt / 1e9).toFixed(2) + 'B' : 'N/A'}`);
    lines.push(`Revenue Growth (YoY): ${fd.revenueGrowth ? (fd.revenueGrowth * 100).toFixed(1) + '%' : 'N/A'}`);
    lines.push(`Earnings Growth: ${fd.earningsGrowth ? (fd.earningsGrowth * 100).toFixed(1) + '%' : 'N/A'}`);
    lines.push(`Analyst Target Price: $${fd.targetMeanPrice ?? 'N/A'}`);
    lines.push(`Recommendation: ${fd.recommendationKey ?? 'N/A'}`);
  }

  if (s?.defaultKeyStatistics) {
    const ks = s.defaultKeyStatistics;
    lines.push(`\n### Valuation`);
    lines.push(`P/E Ratio (TTM): ${ks.trailingEps && q?.regularMarketPrice ? (q.regularMarketPrice / ks.trailingEps).toFixed(2) : 'N/A'}`);
    lines.push(`EPS (TTM): $${ks.trailingEps ?? 'N/A'}`);
    lines.push(`Forward EPS: $${ks.forwardEps ?? 'N/A'}`);
    lines.push(`PEG Ratio: ${ks.pegRatio ?? 'N/A'}`);
    lines.push(`Price/Book: ${ks.priceToBook ?? 'N/A'}`);
    lines.push(`Beta: ${ks.beta ?? 'N/A'}`);
    lines.push(`Shares Outstanding: ${ks.sharesOutstanding ? (ks.sharesOutstanding / 1e9).toFixed(2) + 'B' : 'N/A'}`);
  }

  if (s?.summaryProfile) {
    const sp = s.summaryProfile;
    lines.push(`\n### Company Profile`);
    lines.push(`Sector: ${sp.sector ?? 'N/A'} | Industry: ${sp.industry ?? 'N/A'}`);
    lines.push(`Employees: ${sp.fullTimeEmployees?.toLocaleString() ?? 'N/A'}`);
    lines.push(`Country: ${sp.country ?? 'N/A'}`);
    if (sp.longBusinessSummary) {
      lines.push(`\nBusiness Summary: ${sp.longBusinessSummary.slice(0, 500)}...`);
    }
  }

  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { message, ticker, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured in .env' }, { status: 500 });
    }

    // Detect ticker from message if not provided
    let resolvedTicker = ticker;
    const tickerMatch = message.match(/\b([A-Z]{1,5})\b/) || 
      message.match(/\b(apple|microsoft|google|amazon|tesla|meta|nvidia|netflix)\b/i);
    
    const companyToTicker: Record<string, string> = {
      apple: 'AAPL', microsoft: 'MSFT', google: 'GOOGL', amazon: 'AMZN',
      tesla: 'TSLA', meta: 'META', nvidia: 'NVDA', netflix: 'NFLX',
      samsung: '005930.KS', infosys: 'INFY', tcs: 'TCS.NS', reliance: 'RELIANCE.NS',
    };

    if (!resolvedTicker && tickerMatch) {
      const match = tickerMatch[1];
      resolvedTicker = companyToTicker[match.toLowerCase()] || match.toUpperCase();
    }

    let financialContext = '';
    if (resolvedTicker) {
      const data = await fetchCompanyData(resolvedTicker);
      if (data) {
        financialContext = formatFinancialData(data, resolvedTicker);
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const systemPrompt = `You are FinAn AI, an expert financial analyst assistant embedded in an enterprise financial analytics platform. You have access to real-time financial data from Yahoo Finance.

Your role:
- Answer questions about companies' financial performance, valuation, and market position
- Explain financial metrics clearly (P/E, EBITDA, DCF, M&A concepts)
- Provide investment analysis in a professional, concise manner
- Format numbers clearly (e.g., $12.4B, 23.5%, etc.)

${financialContext ? `\n## Live Financial Data\n${financialContext}` : ''}

Always cite the data source as "Yahoo Finance (real-time)" when using financial figures.
Be concise, professional, and structured. Use bullet points and headers when appropriate.`;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'System context: ' + systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am FinAn AI, ready to provide financial analysis and data.' }],
        },
        ...(history || []),
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({
      response,
      ticker: resolvedTicker || null,
      hasLiveData: !!financialContext,
    });
  } catch (err: any) {
    console.error('Financial chat error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
