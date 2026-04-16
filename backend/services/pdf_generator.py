import os
import uuid
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

def create_ma_pdf_report(results: dict, image_paths: list) -> str:
    """
    Assembles an institutional-grade 5-page M&A Financial Report.
    """
    os.makedirs('temp_pdfs', exist_ok=True)
    pdf_path = f"temp_pdfs/Institutional_Report_{uuid.uuid4().hex}.pdf"
    
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, 
                            leftMargin=0.5*inch, rightMargin=0.5*inch, 
                            topMargin=0.5*inch, bottomMargin=0.5*inch)
    styles = getSampleStyleSheet()
    
    # Custom Institutional Styles
    header_style = ParagraphStyle('HeaderStyle', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#1C2833'), spaceAfter=14, borderPadding=10)
    sub_header_style = ParagraphStyle('SubHeaderStyle', parent=styles['Heading2'], fontSize=16, textColor=colors.HexColor('#2E4053'), spaceAfter=10)
    body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=11, leading=14, alignment=4) # Justified
    data_label_style = ParagraphStyle('DataLabelStyle', parent=styles['Normal'], fontSize=10, textColor=colors.grey)
    
    metrics = results['metrics']
    ma = results['ma']
    dcf = results['dcf']
    
    Story = []
    
    # --- PAGE 1: EXECUTIVE SUMMARY ---
    Story.append(Paragraph(f"PROJECT {ma['targetName'].upper()}: STRATEGIC M&A ANALYSIS", header_style))
    Story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1C2833'), spaceAfter=20))
    
    Story.append(Paragraph("Deal Highlights", sub_header_style))
    highlight_data = [
        ["Acquirer", ma['acquirerName'], "Target", ma['targetName']],
        ["Offer Price", f"${ma['targetSharePrice'] * (1+ma['premiumOffered']):.2f}", "Premium", f"{ma['premiumOffered']*100:.1f}%"],
        ["Transaction EV", f"${metrics['transactionEV']:,.0f}M", "Deal Type", "Strategic Acquisition"],
        ["Accretion/Dilution", f"{metrics['percentAccretion']:+.1f}%", "Deal Verdict", metrics['verdict']]
    ]
    th = Table(highlight_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    th.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F2F4F4')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#F2F4F4')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    Story.append(th)
    Story.append(Spacer(1, 0.4*inch))
    
    Story.append(Paragraph("Analyst Executive Commentary", sub_header_style))
    Story.append(Paragraph(ma['analystComments'], body_style))
    Story.append(Spacer(1, 0.3*inch))
    
    Story.append(Paragraph("Strategic Value Assessment", ParagraphStyle('SmallHeader', parent=styles['Heading3'], fontSize=12)))
    Story.append(Paragraph(f"The combined entity between {ma['acquirerName']} and {ma['targetName']} represents a significant market consolidation. With a projected accretion of {metrics['percentAccretion']:.1f}%, the transaction is financially viable assuming the capture of ${ma['expectedSynergies']:,.0f}M in annual synergies.", body_style))
    
    Story.append(PageBreak())
    
    # --- PAGE 2: TRANSACTION OVERVIEW & PREMIUM ---
    Story.append(Paragraph("Transaction Structure & Value Bridge", header_style))
    Story.append(Spacer(1, 0.2*inch))
    
    structure_text = f"The transaction specifies an offer price of ${ma['targetSharePrice']*(1+ma['premiumOffered']):.2f} per share, representing a {ma['premiumOffered']*100:.1f}% control premium over current trading levels. The deal is financed with {ma['cashPct']*100:.0f}% cash and {(1-ma['cashPct'])*100:.0f}% equity issued at {ma['acquirerName']}'s current price."
    Story.append(Paragraph(structure_text, body_style))
    Story.append(Spacer(1, 0.4*inch))
    
    if len(image_paths) > 2:
        img_val = Image(image_paths[2], width=6*inch, height=3.5*inch)
        Story.append(img_val)
        
    Story.append(Spacer(1, 0.4*inch))
    Story.append(Paragraph("Financing Details", sub_header_style))
    finance_data = [
        ["Financing Component", "Amount ($M)", "Percentage (%)"],
        ["Cash Consideration", f"${metrics['offerValue']*ma['cashPct']:,.0f}", f"{ma['cashPct']*100:.1f}%"],
        ["Equity Consideration", f"${metrics['offerValue']*(1-ma['cashPct']):,.0f}", f"{(1-ma['cashPct'])*100:.1f}%"],
        ["Total Purchase Price", f"${metrics['offerValue']:,.0f}", "100.0%"]
    ]
    tf = Table(finance_data, colWidths=[2.5*inch, 2*inch, 1.5*inch])
    tf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2C3E50')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('GRID', (0,0), (-1,-1), 1, colors.grey),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 8)
    ]))
    Story.append(tf)
    
    Story.append(PageBreak())
    
    # --- PAGE 3: ACCRETION/DILUTION & EPS BRIDGE ---
    Story.append(Paragraph("Pro-forma Earnings & Accretion Analysis", header_style))
    Story.append(Spacer(1, 0.2*inch))
    
    eps_text = f"Post-transaction, {ma['acquirerName']} is expected to see a {'pro-forma accretion' if metrics['percentAccretion'] > 0 else 'dilution'} of {metrics['percentAccretion']:.2f}% to its standalone EPS of ${metrics['standaloneEPS']:.2f}. This accounts for debt interest of ${metrics['offerValue']*ma['cashPct']*ma['debtFinancingRate']:,.0f}M and synergies."
    Story.append(Paragraph(eps_text, body_style))
    Story.append(Spacer(1, 0.3*inch))
    
    if len(image_paths) > 3:
        img_own = Image(image_paths[3], width=5*inch, height=5.5*inch)
        Story.append(img_own)
        
    Story.append(Spacer(1, 0.4*inch))
    eps_data = [
        ["EPS Bridge Component", "Standalone", "Pro-forma"],
        ["Net Income ($M)", f"${ma['acquirerNetIncome']:,.0f}", f"${metrics['proFormaEPS'] * (ma['acquirerSharesOutstanding'] + metrics['targetOwnership']/100 * (ma['acquirerSharesOutstanding']/(metrics['acquirerOwnership']/100))):,.0f}"], # Simplified
        ["Shares Outstanding (M)", f"{ma['acquirerSharesOutstanding']:,.1f}", f"{(ma['acquirerSharesOutstanding'] + (metrics['targetOwnership']/100 * (ma['acquirerSharesOutstanding']/(metrics['acquirerOwnership']/100)))):,.1f}"],
        ["Earnings Per Share ($)", f"${metrics['standaloneEPS']:.2f}", f"${metrics['proFormaEPS']:.2f}"],
        ["Accretion / (Dilution)", "-", f"{metrics['percentAccretion']:+.2f}%"]
    ]
    te = Table(eps_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
    te.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1C2833')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('ALIGN', (1,0), (2,-1), 'CENTER'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('PADDING', (0,0), (-1,-1), 10)
    ]))
    Story.append(te)
    
    Story.append(PageBreak())
    
    # --- PAGE 4: VALUATION MULTIPLES & DCF ---
    Story.append(Paragraph("Valuation Multiples & DCF Summary", header_style))
    Story.append(Spacer(1, 0.2*inch))
    
    Story.append(Paragraph(f"Intrinsic valuation based on Discounted Cash Flow (DCF) implies a price of ${dcf['impliedSharePrice']:.2f} per share for Project {ma['targetName'].upper()}. The current deal value of ${ma['targetSharePrice']*(1+ma['premiumOffered']):.2f} is {'below' if ma['targetSharePrice']*(1+ma['premiumOffered']) < dcf['impliedSharePrice'] else 'above'} intrinsic fair value.", body_style))
    Story.append(Spacer(1, 0.4*inch))
    
    mult_data = [
        ["Multiple Check", "Acquirer", "Target (Market)", "Target (Offer)"],
        ["EV / EBITDA", f"{metrics['acquirerEV_EBITDA']:.1f}x", f"{ma['targetSharePrice']*ma['targetSharesOutstanding']/ma['targetEbitda']:.1f}x", f"{metrics['targetEV_EBITDA']:.1f}x"],
        ["P / E Ratio", f"{ma['acquirerSharePrice']/(ma['acquirerNetIncome']/ma['acquirerSharesOutstanding']):.1f}x", f"{ma['targetSharePrice']/(ma['targetNetIncome']/ma['targetSharesOutstanding']):.1f}x", f"{(ma['targetSharePrice']*(1+ma['premiumOffered']))/(ma['targetNetIncome']/ma['targetSharesOutstanding']):.1f}x"]
    ]
    tm = Table(mult_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    tm.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2E4053')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('GRID', (0,0), (-1,-1), 1, colors.grey),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 10)
    ]))
    Story.append(tm)
    
    Story.append(Spacer(1, 0.5*inch))
    Story.append(Paragraph("Synergy Realization Roadmap", sub_header_style))
    if len(image_paths) > 0:
        img_syn = Image(image_paths[0], width=6*inch, height=3.5*inch)
        Story.append(img_syn)
    
    Story.append(PageBreak())
    
    # --- PAGE 5: RISK & SENSITIVITY ---
    Story.append(Paragraph("Sensitivity Analysis & Deal Resilience", header_style))
    Story.append(Spacer(1, 0.2*inch))
    
    Story.append(Paragraph("The chart below illustrates the EPS accretion sensitivity relative to varying Synergy realization and Control Premium levels. Green zones indicate value-accretive scenarios for the Acquirer shareholders.", body_style))
    Story.append(Spacer(1, 0.3*inch))
    
    if len(image_paths) > 1:
        img_sens = Image(image_paths[1], width=6*inch, height=5*inch)
        Story.append(img_sens)
        
    Story.append(Spacer(1, 0.3*inch))
    Story.append(Paragraph("Risk Assessment & Capital Structure", sub_header_style))
    Story.append(Paragraph(f"Combined Leverage Ratio (Net Debt / EBITDA) is projected at {metrics['leverageRatio']:.2f}x. This level suggests a {'moderate' if metrics['leverageRatio'] < 3 else 'high'} debt burden following the integration. Interest coverage remains {'sufficient' if metrics['leverageRatio'] < 4 else 'tight'} to support the operational requirements.", body_style))
    
    Story.append(Spacer(1, 0.5*inch))
    Story.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    Story.append(Paragraph("DISCLAIMER: This analysis is for informational purposes only and does not constitute financial advice. All projections are subject to market conditions and integration success.", ParagraphStyle('Disc', parent=styles['Italic'], fontSize=8, textColor=colors.grey)))
    
    doc.build(Story)
    return pdf_path
