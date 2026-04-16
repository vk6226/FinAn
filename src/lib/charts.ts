import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 600;
const height = 350;

function createCanvas() {
  return new ChartJSNodeCanvas({ width, height, backgroundColour: '#ffffff' });
}

/**
 * DCF Waterfall Chart — PV of FCFs → PV Terminal → Enterprise Value → less Debt → Equity Value
 */
export async function generateDCFWaterfallChart(dcfData: any): Promise<Buffer> {
  const canvas = createCanvas();
  const labels = ['PV of FCFs', 'PV Terminal', 'Enterprise Value', 'Less: Net Debt', 'Equity Value'];
  const values = [
    dcfData.pvOfFCFs,
    dcfData.pvTerminal,
    dcfData.enterpriseValue,
    -(dcfData.enterpriseValue - dcfData.equityValue),
    dcfData.equityValue,
  ];
  const colors = values.map(v => v >= 0 ? 'rgba(41, 151, 255, 0.8)' : 'rgba(255, 69, 58, 0.8)');
  // Override the cumulative items with a distinct color
  colors[2] = 'rgba(48, 209, 88, 0.7)'; // Enterprise Value = sum
  colors[4] = 'rgba(48, 209, 88, 0.8)'; // Equity Value = final

  const config: any = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values.map(Math.abs),
        backgroundColor: colors,
        borderColor: colors.map((c: string) => c.replace('0.8', '1').replace('0.7', '1')),
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'DCF Valuation Bridge ($M)', font: { size: 16, weight: 'bold' }, color: '#1d1d1f' },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v: number) => `$${(v/1000).toFixed(0)}B` }, grid: { color: '#e5e5e7' } },
        x: { grid: { display: false } },
      },
    },
  };
  return await canvas.renderToBuffer(config);
}

/**
 * Projected FCF Bar Chart — Year-by-year free cash flows
 */
export async function generateFCFBarChart(dcfData: any): Promise<Buffer> {
  const canvas = createCanvas();
  const fcfs: number[] = dcfData.projectedFCFs || [];
  const labels = fcfs.map((_: number, i: number) => `Year ${i + 1}`);

  const config: any = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Projected FCF ($M)',
        data: fcfs,
        backgroundColor: 'rgba(41, 151, 255, 0.7)',
        borderColor: 'rgba(41, 151, 255, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Projected Free Cash Flows ($M)', font: { size: 16, weight: 'bold' }, color: '#1d1d1f' },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v: number) => `$${v.toLocaleString()}` }, grid: { color: '#e5e5e7' } },
        x: { grid: { display: false } },
      },
    },
  };
  return await canvas.renderToBuffer(config);
}

/**
 * M&A Deal Structure Pie Chart — Cash vs Stock split
 */
export async function generateDealStructurePie(maData: any): Promise<Buffer> {
  const canvas = createCanvas();
  const config: any = {
    type: 'doughnut',
    data: {
      labels: ['Cash Component', 'Stock Component'],
      datasets: [{
        data: [maData.cashComponent || 0, maData.stockComponent || 0],
        backgroundColor: ['rgba(255, 159, 10, 0.8)', 'rgba(191, 90, 242, 0.8)'],
        borderColor: ['rgba(255, 159, 10, 1)', 'rgba(191, 90, 242, 1)'],
        borderWidth: 2,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 20 } },
        title: { display: true, text: 'Deal Financing Structure', font: { size: 16, weight: 'bold' }, color: '#1d1d1f' },
      },
    },
  };
  return await canvas.renderToBuffer(config);
}

/**
 * Accretion/Dilution Chart — Pre vs Post Merger EPS
 */
export async function generateAccretionChart(dcfData: any, maData: any): Promise<Buffer> {
  const canvas = createCanvas();
  const preEPS = dcfData.companyA_eps || 0;
  const postEPS = maData.proFormaEPS || 0;

  const config: any = {
    type: 'bar',
    data: {
      labels: ['Standalone EPS', 'Pro-Forma EPS'],
      datasets: [{
        data: [preEPS, postEPS],
        backgroundColor: [
          'rgba(134, 134, 139, 0.7)',
          postEPS >= preEPS ? 'rgba(48, 209, 88, 0.8)' : 'rgba(255, 69, 58, 0.8)',
        ],
        borderColor: [
          'rgba(134, 134, 139, 1)',
          postEPS >= preEPS ? 'rgba(48, 209, 88, 1)' : 'rgba(255, 69, 58, 1)',
        ],
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.5,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'EPS Accretion / Dilution Analysis', font: { size: 16, weight: 'bold' }, color: '#1d1d1f' },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v: number) => `$${v.toFixed(2)}` }, grid: { color: '#e5e5e7' } },
        x: { grid: { display: false } },
      },
    },
  };
  return await canvas.renderToBuffer(config);
}
