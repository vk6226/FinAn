import pandas as pd
import numpy as np

def perform_ma_analysis(data: dict) -> dict:
    """
    Institutional M&A calculation including Accretion/Dilution, EV Multiples, 
    Sensitivity Analysis, and Capital Structure.
    """
    ma = data['maData']
    dcf = data['dcfData']

    # Normalize property names (database uses 'acquirerPrice', analysis used 'acquirerSharePrice')
    ap = ma.get('acquirerPrice', ma.get('acquirerSharePrice', 0))
    tp = ma.get('targetPrice', ma.get('targetSharePrice', 0))
    as_ = ma.get('acquirerShares', ma.get('acquirerSharesOutstanding', 0))
    ts = ma.get('targetShares', ma.get('targetSharesOutstanding', 0))
    ani = ma.get('acquirerNetIncome', 0)
    tni = ma.get('targetNetIncome', 0)
    arev = ma.get('acquirerRevenue', 0)
    trev = ma.get('targetRevenue', 0)
    aeb = ma.get('acquirerEbitda', 0)
    teb = ma.get('targetEbitda', 0)
    and_ = ma.get('acquirerNetDebt', 0)
    tnd = ma.get('targetNetDebt', 0)
    
    # Synergies
    syn = ma.get('synergies', ma.get('expectedSynergies', 0))
    prem = ma.get('dealPremium', ma.get('premiumOffered', 0))
    if prem > 1: prem /= 100 # Handle percentage vs decimal
    
    cpct = ma.get('cashPct', 0)
    if cpct > 1: cpct /= 100
    
    dfr = ma.get('debtFinancingRate', 0)
    if dfr > 1: dfr /= 100

    ic = ma.get('integrationCosts', 0)

    # 1. Market Caps & Enterprise Values
    acquirer_mkt_cap = ap * as_
    target_mkt_cap = tp * ts
    
    acquirer_ev = acquirer_mkt_cap + and_
    target_ev = target_mkt_cap + tnd
    
    # 2. Premium Analysis
    offer_price = tp * (1 + prem)
    offer_value = offer_price * ts
    premium_dollar = offer_value - target_mkt_cap
    transaction_ev = offer_value + tnd
    
    # 3. Multiples Analysis
    acquirer_ev_ebitda = acquirer_ev / aeb if aeb else 0
    target_ev_ebitda = transaction_ev / teb if teb else 0
    
    # 4. Financing & Shares
    cash_portion = offer_value * cpct
    stock_portion = offer_value * (1 - cpct)
    
    new_shares_issued = stock_portion / ap if ap else 0
    pro_forma_shares = as_ + new_shares_issued
    
    # 5. Accretion/Dilution Analysis
    interest_expense = cash_portion * dfr
    tax_shield = interest_expense * 0.25
    
    pro_forma_net_income = ani + tni + syn - ic - interest_expense + tax_shield
    
    standalone_eps = ani / as_ if as_ else 0
    pro_forma_eps = pro_forma_net_income / pro_forma_shares if pro_forma_shares else 0
    
    percent_accretion = ((pro_forma_eps / standalone_eps) - 1) * 100 if standalone_eps else 0
    
    # 6. Ownership & Capital Structure
    acquirer_ownership = (as_ / pro_forma_shares) * 100 if pro_forma_shares else 100
    target_ownership = (new_shares_issued / pro_forma_shares) * 100 if pro_forma_shares else 0
    
    pro_forma_debt = and_ + tnd + cash_portion
    pro_forma_ebitda = aeb + teb + syn
    leverage_ratio = pro_forma_debt / pro_forma_ebitda if pro_forma_ebitda else 0
    
    # 7. Synergy Timeline
    years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']
    synergy_capture = [
        syn * 0.3, 
        syn * 0.6, 
        syn * 0.9, 
        syn * 1.0, 
        syn * 1.1 # Efficiency gains beyond original estimate
    ]
    
    # 8. Sensitivity Analysis (Dummy Matrix for Visualization)
    # Rows: Premium (+/- 10%), Cols: Synergies (+/- 20%)
    sensitivity_matrix = []
    for p_adj in [-0.1, 0, 0.1]:
        row = []
        for s_adj in [-0.2, 0, 0.2]:
            adj_pro_forma_ni = pro_forma_net_income + (syn * s_adj)
            adj_eps = adj_pro_forma_ni / pro_forma_shares if pro_forma_shares else 0
            row.append(((adj_eps / standalone_eps) - 1) * 100 if standalone_eps else 0)
        sensitivity_matrix.append(row)

    return {
        "ma": ma,
        "dcf": dcf,
        "metrics": {
            "acquirerMarketCap": acquirer_mkt_cap,
            "targetMarketCap": target_mkt_cap,
            "acquirerEV": acquirer_ev,
            "targetEV": target_ev,
            "transactionEV": transaction_ev,
            "offerValue": offer_value,
            "premiumDollar": premium_dollar,
            "acquirerEV_EBITDA": acquirer_ev_ebitda,
            "targetEV_EBITDA": target_ev_ebitda,
            "standaloneEPS": standalone_eps,
            "proFormaEPS": pro_forma_eps,
            "percentAccretion": percent_accretion,
            "acquirerOwnership": acquirer_ownership,
            "targetOwnership": target_ownership,
            "leverageRatio": leverage_ratio,
            "years": years,
            "synergyCapture": synergy_capture,
            "sensitivityMatrix": sensitivity_matrix,
            "verdict": "STRATEGICALLY ACCRETIVE" if percent_accretion > 0 else "DILUTIVE / CHALLENGING"
        }
    }
