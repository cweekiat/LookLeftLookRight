import pandas as pd
import yfinance as yf
from datetime import datetime
import math

def compute_portfolio_metrics(transactions):
    df = pd.DataFrame([{
        "date": t.date,
        "ticker": t.ticker,
        "action": t.action.lower(),
        "shares": t.shares,
        "price": t.price,
        "amount": t.amount
    } for t in transactions])

    if df.empty:
        return {
            "total_invested": 0,
            "current_value": 0,
            "profit": 0,
            "net_shares": {},
            "cagr": 0,
            "max_drawdown": 0,
            "sharpe_ratio": 0
        }

    df["date"] = pd.to_datetime(df["date"])
    df["signed_shares"] = df.apply(lambda row: row["shares"] if row["action"] == "buy" else -row["shares"], axis=1)

    total_invested = df[df["signed_shares"] > 0]["amount"].sum()
    net_shares_per_ticker = df.groupby("ticker")["signed_shares"].sum()
    net_shares_per_ticker = net_shares_per_ticker[net_shares_per_ticker != 0]
    tickers = net_shares_per_ticker.index.tolist()

    if not tickers:
        return {
            "total_invested": round(total_invested, 2),
            "current_value": 0,
            "profit": -round(total_invested, 2),
            "net_shares": {},
            "cagr": 0,
            "max_drawdown": 0,
            "sharpe_ratio": 0
        }

    latest_transaction_date = df["date"].max()
    fetch_start = (latest_transaction_date - pd.Timedelta(days=5)).strftime('%Y-%m-%d')
    fetch_end = (latest_transaction_date + pd.Timedelta(days=1)).strftime('%Y-%m-%d')

    prices_now = yf.download(tickers, start=fetch_start, end=fetch_end, auto_adjust=True, progress=False)["Close"]

    if isinstance(prices_now, pd.Series):
        prices_now = prices_now.to_frame().T

    prices_now = prices_now.ffill().bfill()

    # Get the closest available prices on or before the latest transaction date
    valid_prices = prices_now.loc[:latest_transaction_date].iloc[-1]

    current_value = 0
    for ticker in tickers:
        if ticker in valid_prices.index:
            price_on_date = valid_prices[ticker]
            if pd.notna(price_on_date):
                current_value += net_shares_per_ticker[ticker] * price_on_date

    profit = current_value - total_invested

    # Safe CAGR Calculation
    start_date = df["date"].min()
    end_date = latest_transaction_date
    days_held = (end_date - start_date).days
    years_held = days_held / 365.25 if days_held > 0 else 1 / 365.25

    if total_invested > 0 and current_value > 0 and years_held > 0:
        try:
            ratio = current_value / total_invested
            cagr = (math.pow(ratio, 1 / years_held) - 1) * 100
            if math.isnan(cagr) or math.isinf(cagr):
                cagr = 0
        except Exception:
            cagr = 0
    else:
        cagr = 0

    # Max Drawdown
    df_sorted = df.sort_values("date")
    df_sorted["cumulative_value"] = df_sorted["amount"].cumsum()
    rolling_max = df_sorted["cumulative_value"].cummax()
    drawdown = df_sorted["cumulative_value"] / rolling_max - 1
    max_drawdown = drawdown.min() * 100 if not drawdown.empty else 0

    # Sharpe Ratio
    returns = df_sorted["cumulative_value"].pct_change().dropna()
    try:
        sharpe_ratio = ((returns.mean() - 0.02 / 252) / returns.std()) * (252 ** 0.5) if not returns.empty and returns.std() > 0 else 0
    except Exception:
        sharpe_ratio = 0

    return {
        "total_invested": round(total_invested, 2),
        "current_value": round(current_value, 2),
        "profit": round(profit, 2),
        "net_shares": {ticker: round(share, 2) for ticker, share in net_shares_per_ticker.items()},
        "cagr": round(cagr, 2),
        "max_drawdown": round(max_drawdown, 2),
        "sharpe_ratio": round(sharpe_ratio, 2)
    }
