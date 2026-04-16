import matplotlib.pyplot as plt
import io
import base64
try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except Exception as e:
    print(f"Warning: WeasyPrint could not be loaded. PDF generation will be disabled. Error: {e}")
    WEASYPRINT_AVAILABLE = False
from datetime import datetime

class ReportEngine:

    @staticmethod
    def generate_charts(dcf_data: dict, ma_data: dict):
        charts = {}
        
        # 1. Projected FCF Chart
        fcfs = dcf_data.get('projectedFCFs', [])
        if fcfs:
            fig, ax = plt.subplots(figsize=(8, 4))
            ax.bar(range(1, len(fcfs) + 1), fcfs, color='#2997ff', alpha=0.8)
            ax.set_title("Projected Free Cash Flows ($M)", fontsize=14, fontweight='bold', color='#1d1d1f')
            ax.set_ylabel("$M")
            ax.set_xlabel("Year")
            charts['fcf_chart'] = ReportEngine._fig_to_base64(fig)

        # 2. Deal Structure Pie
        cash = ma_data.get('cashComponent', 0)
        stock = ma_data.get('stockComponent', 0)
        if cash + stock > 0:
            fig, ax = plt.subplots(figsize=(5, 5))
            ax.pie([cash, stock], labels=['Cash', 'Stock'], autopct='%1.1f%%', 
                   colors=['#ff9f0a', '#bf5af2'], startangle=90, wedgeprops={'edgecolor': 'white'})
            ax.set_title("Deal Financing Structure", fontsize=14, fontweight='bold')
            charts['deal_pie'] = ReportEngine._fig_to_base64(fig)

        return charts

    @staticmethod
    def generate_pdf(report: dict, dcf_data: dict, ma_data: dict, analyst_name: str):
        charts = ReportEngine.generate_charts(dcf_data, ma_data)
        
        # Premium CSS for Apple-like PDF
        css = """
        @page { size: A4; margin: 2cm; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1d1d1f; line-height: 1.6; }
        .header { border-bottom: 2px solid #2997ff; padding-bottom: 20px; margin-bottom: 30px; }
        .brand { color: #2997ff; font-weight: bold; font-size: 24px; margin-bottom: 5px; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .meta { color: #86868b; font-size: 12px; }
        
        h2 { border-bottom: 1px solid #d2d2d7; padding-bottom: 10px; margin-top: 40px; color: #1d1d1f; }
        .section { margin-bottom: 30px; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .stat-card { background: #f5f5f7; padding: 15px; border-radius: 12px; }
        .stat-label { font-size: 11px; text-transform: uppercase; color: #86868b; }
        .stat-value { font-size: 18px; font-weight: bold; }
        
        .chart-container { text-align: center; margin: 30px 0; }
        .chart-img { max-width: 100%; border-radius: 8px; }
        
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { text-align: left; font-size: 12px; color: #86868b; border-bottom: 1px solid #d2d2d7; padding-bottom: 5px; }
        td { padding: 8px 0; border-bottom: 1px solid #f5f5f7; font-size: 14px; }
        .val { text-align: right; font-weight: bold; }
        
        .footer { position: fixed; bottom: 0; width: 100%; font-size: 10px; color: #86868b; border-top: 1px solid #d2d2d7; padding-top: 10px; }
        """

        html_content = f"""
        <html>
        <head><style>{css}</style></head>
        <body>
            <div className="header">
                <div className="brand">FinAn</div>
                <div className="title">{report['title']}</div>
                <div className="meta">Processed by {analyst_name} | {datetime.now().strftime('%B %d, %Y')}</div>
            </div>

            <div className="section">
                <h2>Executive Valuation Summary</h2>
                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-label">Implied Share Price</div>
                        <div className="stat-value">${dcf_data['impliedSharePrice']:.2f}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Deal Accretion/Dilution</div>
                        <div className="stat-value" style="color: {'#30d158' if ma_data['accretionDilution'] > 0 else '#ff453a'}">
                            {ma_data['accretionDilution']:.2f}%
                        </div>
                    </div>
                </div>
                <p>
                    The comprehensive financial analysis for {report['companyA']} and {report['companyB']} 
                    suggests an implied equity value of ${dcf_data['equityValue']:,.2f}M. 
                    The proposed M&A transaction implies a deal value of ${ma_data['totalDealValue']:,.2f}M 
                    with a financing mix of ${ma_data['cashComponent']:,.2f}M cash and ${ma_data['stockComponent']:,.2f}M stock.
                </p>
            </div>

            <div className="section">
                <h2>DCF Analysis Component</h2>
                <table>
                    <thead>
                        <tr><th>Metric</th><th className="val">Value</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Enterprise Value</td><td className="val">${dcf_data['enterpriseValue']:,.2f}M</td></tr>
                        <tr><td>PV of Terminal Value</td><td className="val">${dcf_data['pvTerminal']:,.2f}M</td></tr>
                        <tr><td>WACC</td><td className="val">{dcf_data['wacc']}%</td></tr>
                        <tr><td>Terminal Growth Rate</td><td className="val">{dcf_data['tgr']}%</td></tr>
                    </tbody>
                </table>
                <div className="chart-container">
                    <img className="chart-img" src="data:image/png;base64,{charts.get('fcf_chart', '')}" />
                </div>
            </div>

            <div className="section">
                <h2>M&A Deal Structure</h2>
                <div className="chart-container">
                    <img className="chart-img" src="data:image/png;base64,{charts.get('deal_pie', '')}" style="max-width: 400px" />
                </div>
            </div>

            <div className="footer">
                CONFIDENTIAL — FinAn Enterprise Financial Intelligence Platform | Page 1
            </div>
        </body>
        </html>
        """

        # Generate PDF
        if not WEASYPRINT_AVAILABLE:
            raise RuntimeError("PDF generation is currently unavailable because the necessary libraries (GTK) are missing from the server.")
            
        pdf_file = HTML(string=html_content).write_pdf()
        return pdf_file
        
