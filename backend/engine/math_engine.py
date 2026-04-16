import pandas as pd
import numpy as np

class FinancialEngine:
    @staticmethod
    def calculate_dcf(data: dict):
        """
        data: {
            companyA_revenue, companyA_ebitda, companyA_netDebt, companyA_shares,
            revenueGrowth, ebitdaMargin, taxRate, wacc, tgr, projectionYears,
            companyA_capex, companyA_da, companyA_nwcChange
        }
        """
        # Extract inputs
        rev = float(data.get('companyA_revenue', 0))
        ebitda_m = float(data.get('ebitdaMargin', 0)) / 100
        tax = float(data.get('taxRate', 0)) / 100
        wacc = float(data.get('wacc', 0)) / 100
        tgr = float(data.get('tgr', 0)) / 100
        years = int(data.get('projectionYears', 5))
        growth = float(data.get('revenueGrowth', 0)) / 100
        
        # Calculate ratios to revenue from year 0
        capex_ratio = float(data.get('companyA_capex', 0)) / rev if rev else 0
        da_ratio = float(data.get('companyA_da', 0)) / rev if rev else 0
        nwc_ratio = abs(float(data.get('companyA_nwcChange', 0))) / rev if rev else 0

        projected_rev = []
        projected_fcf = []
        
        curr_rev = rev
        for y in range(1, years + 1):
            curr_rev *= (1 + growth)
            projected_rev.append(curr_rev)
            
            ebitda = curr_rev * ebitda_m
            da = curr_rev * da_ratio
            ebit = ebitda - da
            nopat = ebit * (1 - tax)
            capex = curr_rev * capex_ratio
            nwc = curr_rev * nwc_ratio
            
            fcf = nopat + da - capex - nwc
            projected_fcf.append(fcf)

        # NPV
        pv_fcf = sum([f / ((1 + wacc) ** (i + 1)) for i, f in enumerate(projected_fcf)])
        
        # Terminal Value
        final_fcf = projected_fcf[-1]
        tv = (final_fcf * (1 + tgr)) / (wacc - tgr)
        pv_tv = tv / ((1 + wacc) ** years)
        
        ev = pv_fcf + pv_tv
        equity_val = ev - float(data.get('companyA_netDebt', 0))
        shares = float(data.get('companyA_shares', 1))
        implied_price = equity_val / shares
        
        standing_price = float(data.get('companyA_price', 1))
        upside = ((implied_price / standing_price) - 1) * 100
        
        # Summary for DB
        return {
            "projectedFCFs": [round(f, 2) for f in projected_fcf],
            "pvOfFCFs": round(pv_fcf, 2),
            "terminalValue": round(tv, 2),
            "pvTerminal": round(pv_tv, 2),
            "enterpriseValue": round(ev, 2),
            "equityValue": round(equity_val, 2),
            "impliedSharePrice": round(implied_price, 2),
            "upside": round(upside, 2),
            "wacc": round(wacc * 100, 2),
            "tgr": round(tgr * 100, 2),
            "projectionYears": years,
            "revenueGrowth": round(growth * 100, 2),
            "ebitdaMargin": round(ebitda_m * 100, 2)
        }

    @staticmethod
    def calculate_ma(data: dict, dcf_results: dict):
        """
        data: All form inputs
        dcf_results: Results from calculate_dcf
        """
        # Target info
        b_price = float(data.get('companyB_price', 0))
        b_shares = float(data.get('companyB_shares', 0))
        premium = float(data.get('premium', 0)) / 100
        
        offer_price = b_price * (1 + premium)
        target_equity_val = offer_price * b_shares
        target_net_debt = float(data.get('companyB_netDebt', 0))
        total_deal_val = target_equity_val + target_net_debt
        
        # Financing
        cash_pct = float(data.get('cashPct', 0)) / 100
        cash_comp = total_deal_val * cash_pct
        stock_comp = total_deal_val * (1 - cash_pct)
        a_price = float(data.get('companyA_price', 1))
        new_shares = stock_comp / a_price
        
        # Combined
        a_shares = float(data.get('companyA_shares', 0))
        comb_shares = a_shares + new_shares
        
        # Synergies
        cost_syn = float(data.get('costSynergies', 0))
        rev_syn = float(data.get('revenueSynergies', 0))
        int_costs = float(data.get('integrationCosts', 0))
        debt_rate = float(data.get('debtFinancingRate', 0)) / 100
        
        # Earnings
        a_net = float(data.get('companyA_netIncome', 0))
        b_net = float(data.get('companyB_netIncome', 0))
        
        comb_net = a_net + b_net + cost_syn + rev_syn - int_costs - (cash_comp * debt_rate)
        pf_eps = comb_net / comb_shares
        a_eps = a_net / a_shares if a_shares else 0
        
        accretion = ((pf_eps / a_eps) - 1) * 100 if a_eps else 0
        
        return {
            "offerPrice": round(offer_price, 2),
            "targetEquityValue": round(target_equity_val, 2),
            "totalDealValue": round(total_deal_val, 2),
            "cashComponent": round(cash_comp, 2),
            "stockComponent": round(stock_comp, 2),
            "newSharesIssued": round(new_shares, 2),
            "combinedShares": round(comb_shares, 2),
            "combinedNetIncome": round(comb_net, 2),
            "proFormaEPS": round(pf_eps, 2),
            "accretionDilution": round(accretion, 2),
            "synergies": round(cost_syn + rev_syn, 2),
            "dealPremium": round(premium * 100, 2)
        }
