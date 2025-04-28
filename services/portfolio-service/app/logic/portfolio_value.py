import pandas as pd
import yfinance as yf
from collections import defaultdict
from datetime import datetime

def fetch_historical_prices_yfinance(tickers, start_date, end_date):
    """
    Fetch monthly close prices for tickers using yfinance with safe handling.
    """
    if not tickers:
        return {}

    tickers_str = " ".join(tickers)
    try:
        data = yf.download(tickers=tickers_str, start=start_date, end=end_date, interval="1mo", group_by='ticker', auto_adjust=True, progress=False)
    except Exception as e:
        print(f"Error fetching data from yfinance: {e}")
        return {}

    price_data = {}
    for ticker in tickers:
        try:
            ticker_data = data[ticker] if len(tickers) > 1 else data  # yfinance returns differently for single ticker
            monthly_prices = ticker_data['Close'].dropna()
            price_data[ticker] = {
                pd.Timestamp(date).to_period('M').to_timestamp(how='end'): float(price)
                for date, price in monthly_prices.items()
                if pd.notna(price) and price > 0
            }
        except Exception as e:
            print(f"Error processing ticker {ticker}: {e}")
            price_data[ticker] = {}
    return price_data

def compute_value_over_time(transactions, target_return):
    if not transactions:
        return {"error": "No transactions provided"}

    try:
        # Convert transactions to DataFrame
        data = [{
            "date": t.date,
            "ticker": t.ticker,
            "action": t.action,
            "shares": t.shares,
            "price": t.price,
            "amount": t.amount,
            "notes": t.notes
        } for t in transactions]

        df = pd.DataFrame(data)
        df["date"] = pd.to_datetime(df["date"], errors='coerce')
        df = df.dropna(subset=["date", "ticker", "shares", "price"])  # Drop rows with critical NaNs

        if df.empty:
            return {"error": "No valid transactions after cleaning."}

        df.sort_values(by="date", inplace=True)

        start_date = df["date"].min()
        end_date = df["date"].max()
        tickers = df["ticker"].unique().tolist()

        # Fetch real historical prices from yfinance
        price_data = fetch_historical_prices_yfinance(tickers, start_date, end_date)

        monthly_values = {}
        holdings = defaultdict(float)

        df["month"] = df["date"].dt.to_period("M")
        all_months = pd.period_range(start=start_date, end=end_date, freq='M')

        for month in all_months:
            monthly_tx = df[df["month"] == month]

            # Update cumulative holdings
            for _, row in monthly_tx.iterrows():
                if row["action"].lower() == "buy":
                    holdings[row["ticker"]] += row["shares"]
                elif row["action"].lower() == "sell":
                    holdings[row["ticker"]] -= row["shares"]

            # Calculate portfolio value at the end of the month
            month_end_date = month.to_timestamp(how='end')
            total_value = 0.0
            for ticker, shares in holdings.items():
                if shares <= 0:
                    continue  # Skip tickers with no shares
                price_for_date = price_data.get(ticker, {}).get(month_end_date)
                if price_for_date is None or price_for_date <= 0:
                    continue  # Skip missing or invalid price
                total_value += shares * price_for_date

            monthly_values[str(month)] = round(total_value, 2)

        return {
            "start_date": str(start_date.date()),
            "end_date": str(end_date.date()),
            "monthly_portfolio_value": monthly_values,
            "target_return": target_return
        }

    except Exception as e:
        print(f"Unexpected error in compute_value_over_time: {e}")
        return {"error": f"An error occurred: {e}"}
