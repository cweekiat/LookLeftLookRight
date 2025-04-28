from datetime import datetime
import pandas as pd
import numpy as np
import yfinance as yf

def simulate_dca_projection(initial_investment, monthly_contribution, years, actual_cagr, optimized_cagr):
    months = years * 12
    start_date = datetime.utcnow()
    date_range = pd.date_range(start=start_date, periods=months, freq='MS')

    actual_monthly_return = (1 + actual_cagr / 100) ** (1 / 12) - 1
    optimized_monthly_return = (1 + optimized_cagr / 100) ** (1 / 12) - 1

    actual_values = []
    optimized_values = []

    actual_value = initial_investment
    optimized_value = initial_investment

    for _ in range(months):
        actual_value = (actual_value + monthly_contribution) * (1 + actual_monthly_return)
        optimized_value = (optimized_value + monthly_contribution) * (1 + optimized_monthly_return)

        actual_values.append(round(actual_value, 2))
        optimized_values.append(round(optimized_value, 2))

    return {
        "dates": [date.strftime("%Y-%m") for date in date_range],
        "actual_portfolio_values": actual_values,
        "optimized_portfolio_values": optimized_values,
        "actual_cagr": round(actual_cagr, 2),
        "optimized_cagr": round(optimized_cagr, 2)
    }
