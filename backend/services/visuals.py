import matplotlib.pyplot as plt
import os
import uuid
import numpy as np

def generate_ma_visuals(results: dict) -> list:
    """
    Generates institutional-grade charts including Waterfall, Sensitivity Heatmap, and Comparison Bars.
    """
    os.makedirs('temp_images', exist_ok=True)
    paths = []
    
    metrics = results['metrics']
    ma = results['ma']
    
    # --- 1. Synergy Timeline (High-end Area Chart) ---
    plt.figure(figsize=(10, 6))
    plt.fill_between(metrics['years'], metrics['synergyCapture'], color='#2ECC71', alpha=0.3)
    plt.plot(metrics['years'], metrics['synergyCapture'], color='#27AE60', marker='o', linewidth=2)
    plt.title("Projected Synergy Realization (5-Year Forecast)", fontsize=14, fontweight='bold', pad=20)
    plt.ylabel("Incr. Cashflow ($M)", fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.3)
    path1 = f"temp_images/synergy_{uuid.uuid4().hex}.png"
    plt.savefig(path1, bbox_inches='tight', dpi=150)
    plt.close()
    paths.append(path1)
    
    # --- 2. Accretion Sensitivity Heatmap ---
    import seaborn as sns
    plt.figure(figsize=(10, 8))
    data = np.array(metrics['sensitivityMatrix'])
    columns = ['-20%', 'Base', '+20%'] # Synergies
    rows = ['-10%', 'Base', '+10%'] # Premium
    sns.heatmap(data, annot=True, fmt=".2f", cmap="RdYlGn", 
                xticklabels=columns, yticklabels=rows, center=0, cbar_kws={'label': 'Accretion / Dilution (%)'})
    plt.title("EPS Sensitivity: Synergies vs. Premium (%)", fontsize=14, fontweight='bold', pad=20)
    plt.xlabel("Synergy Capture Variation", fontsize=12)
    plt.ylabel("Offer Premium Variation", fontsize=12)
    path2 = f"temp_images/sensitivity_{uuid.uuid4().hex}.png"
    plt.savefig(path2, bbox_inches='tight', dpi=150)
    plt.close()
    paths.append(path2)
    
    # --- 3. Enterprise Value Comparison (Target Market vs. Offer) ---
    plt.figure(figsize=(10, 6))
    labels = ['Target Mkt Value', 'Control Premium', 'Synergy Value']
    values = [metrics['targetMarketCap'], metrics['premiumDollar'], ma['expectedSynergies'] * 5] # PV of synergies roughly
    colors = ['#34495E', '#F1C40F', '#2ECC71']
    
    # Waterfall Bar Plot simulation
    cumulative = 0
    for i, (label, val, color) in enumerate(zip(labels, values, colors)):
        plt.bar(label, val, bottom=cumulative, color=color, alpha=0.8)
        cumulative += val
        
    plt.title("M&A Value Bridge: Standalone to Pro-forma", fontsize=14, fontweight='bold', pad=20)
    plt.ylabel("Value ($M)", fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.3)
    path3 = f"temp_images/value_bridge_{uuid.uuid4().hex}.png"
    plt.savefig(path3, bbox_inches='tight', dpi=150)
    plt.close()
    paths.append(path3)
    
    # --- 4. Ownership Pie (High contrast) ---
    plt.figure(figsize=(8, 8))
    labels = [f"{ma['acquirerName']} Sh.", f"{ma['targetName']} Sh."]
    sizes = [metrics['acquirerOwnership'], metrics['targetOwnership']]
    colors = ['#3498DB', '#E74C3C']
    plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140, colors=colors, explode=(0.05, 0), 
            textprops={'fontsize': 12, 'fontweight': 'bold'})
    plt.title("Pro-forma Ownership Distribution", fontsize=14, fontweight='bold', pad=10)
    path4 = f"temp_images/ownership_{uuid.uuid4().hex}.png"
    plt.savefig(path4, bbox_inches='tight', dpi=150)
    plt.close()
    paths.append(path4)
    
    return paths
