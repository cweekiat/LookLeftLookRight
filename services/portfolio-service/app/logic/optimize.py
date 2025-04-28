import pandas as pd
import numpy as np
import yfinance as yf
from scipy.optimize import minimize
from datetime import datetime, timedelta
import math

def optimize_portfolio(transactions, target_return=0.08):
    df = pd.DataFrame([{
        "date": t.date,
        "ticker": t.ticker,
        "action": t.action,
        "shares": t.shares,
        "price": t.price,
        "amount": t.amount
    } for t in transactions])

    if df.empty:
        return {"message": "No transactions to optimize."}

    df["signed_shares"] = df.apply(lambda row: row["shares"] if row["action"] == "buy" else -row["shares"], axis=1)
    net_shares_per_ticker = df.groupby("ticker")["signed_shares"].sum()
    net_shares_per_ticker = net_shares_per_ticker[net_shares_per_ticker > 0]  # Only positive holdings
    tickers = net_shares_per_ticker.index.tolist()

    if not tickers:
        return {"message": "No net holdings to optimize."}

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=365 * 3)
    price_data = yf.download(tickers, start=start_date, end=end_date, auto_adjust=True, progress=False)["Close"]

    # Ensure price data is usable
    if isinstance(price_data, pd.Series):
        price_data = price_data.to_frame()

    price_data = price_data.dropna(how='all').ffill().bfill()  # Fill missing data

    if price_data.empty or price_data.shape[1] != len(tickers):
        return {"message": "Insufficient price data for optimization."}

    returns = price_data.pct_change().dropna()
    mean_returns = returns.mean() * 252
    cov_matrix = returns.cov() * 252
    num_assets = len(tickers)

    # Feasibility checks
    feasible_return = np.dot(np.ones(num_assets) / num_assets, mean_returns)
    min_possible_return = mean_returns.min()
    max_possible_return = mean_returns.max()

    if target_return > max_possible_return or target_return < min_possible_return:
        return {
            "message": "Target return not feasible with current assets.",
            "feasible_return_range": {
                "min": round(feasible_return, 4),
                "max": round(max_possible_return, 4)
            }
        }

    def portfolio_volatility(weights, cov_matrix):
        return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))

    def return_constraint(weights):
        return np.dot(weights, mean_returns) - target_return

    initial_weights = np.ones(num_assets) / num_assets
    constraints = (
        {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
        {'type': 'eq', 'fun': return_constraint}
    )
    bounds = tuple((0, 1) for _ in range(num_assets))

    result = minimize(portfolio_volatility, initial_weights,
                      args=(cov_matrix,),
                      method='SLSQP',
                      bounds=bounds,
                      constraints=constraints)

    if not result.success:
        return {"message": "Optimization failed", "reason": result.message}

    optimized_weights = result.x
    portfolio_return = np.dot(optimized_weights, mean_returns)
    portfolio_vol = portfolio_volatility(optimized_weights, cov_matrix)
    sharpe_ratio = (portfolio_return - 0.02) / portfolio_vol if portfolio_vol != 0 else 0

    optimized_allocation = {ticker: round(weight, 4) for ticker, weight in zip(tickers, optimized_weights)}

    total_invested = df[df["signed_shares"] > 0]["amount"].sum()

    weighted_returns = (returns * optimized_weights).sum(axis=1)
    cumulative_returns = (1 + weighted_returns).cumprod()

    current_value = total_invested * cumulative_returns.iloc[-1] if total_invested > 0 else 0
    profit = current_value - total_invested

    # Calculate CAGR safely
    start_date_data = df["date"].min()
    years_held = (end_date - start_date_data).days / 365.25
    try:
        if total_invested > 0 and years_held > 0 and current_value > 0:
            ratio = current_value / total_invested
            cagr = (math.pow(ratio, 1 / years_held) - 1) * 100
            if math.isnan(cagr) or math.isinf(cagr):
                cagr = 0
        else:
            cagr = 0
    except Exception:
        cagr = 0

    # Max Drawdown calculation
    cumulative_values = total_invested * cumulative_returns
    rolling_max = cumulative_values.cummax()
    drawdown = cumulative_values / rolling_max - 1
    max_drawdown = drawdown.min() * 100 if not drawdown.empty else 0

    # Sharpe Ratio
    sharpe_ratio_full = ((weighted_returns.mean() - 0.02 / 252) / weighted_returns.std()) * (252 ** 0.5) \
        if not weighted_returns.empty and weighted_returns.std() > 0 else 0

    # Net shares using last available prices
    latest_prices = price_data.iloc[-1]
    net_shares = {}
    for ticker, weight in zip(tickers, optimized_weights):
        price = latest_prices.get(ticker, np.nan)
        if pd.notna(price) and price > 0:
            shares = (weight * total_invested / price)
            net_shares[ticker] = round(shares, 2)
        else:
            net_shares[ticker] = 0

    return {
        "optimized_allocation": optimized_allocation,
        "expected_return": round(portfolio_return, 4),
        "expected_volatility": round(portfolio_vol, 4),
        "sharpe_ratio": round(sharpe_ratio, 4),
        "total_invested": round(total_invested, 2),
        "current_value": round(current_value, 2),
        "profit": round(profit, 2),
        "net_shares": net_shares,
        "cagr": round(cagr, 2),
        "max_drawdown": round(max_drawdown, 2),
        "sharpe_ratio_full": round(sharpe_ratio_full, 2)
    }
