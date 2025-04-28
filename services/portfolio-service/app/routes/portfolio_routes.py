from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request, Query
from sqlalchemy.orm import Session
from app.models import Portfolio, Transaction, User
from app.database import SessionLocal
from app.logic.metrics import compute_portfolio_metrics
from app.logic.optimize import optimize_portfolio  
from app.logic.simulate_dca import simulate_dca_projection
from app.logic.portfolio_value import compute_value_over_time
from app.schemas.portfolio import PortfolioUpdateRequest
import pandas as pd
from io import StringIO

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================
# CSV Upload & Portfolio Create
# ==========================
@router.post("/upload")
def upload(file: UploadFile = File(...), request: Request = None, db: Session = Depends(get_db)):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = file.file.read().decode("utf-8")
    df = pd.read_csv(StringIO(content))

    required_columns = {"date", "ticker", "action", "shares", "price", "amount", "notes"}
    if not required_columns.issubset(df.columns):
        missing = required_columns - set(df.columns)
        raise HTTPException(status_code=400, detail=f"CSV missing columns: {missing}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id, email=f"{user_id}@example.com")
        db.add(user)
        db.commit()
        db.refresh(user)

    portfolio = Portfolio(user_id=user_id, name="Imported Portfolio")
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)

    for _, row in df.iterrows():
        transaction = Transaction(
            portfolio_id=portfolio.id,
            date=pd.to_datetime(row["date"]),
            ticker=row["ticker"],
            action=row["action"],
            shares=row["shares"],
            price=row["price"],
            amount=row["amount"],
            notes=row.get("notes", "")
        )
        db.add(transaction)

    db.commit()

    return {"message": "Portfolio and transactions uploaded", "portfolio_id": portfolio.id}

# ==========================
# Debug: Get All Portfolios
# ==========================
@router.get("/debug/portfolios")
def debug_portfolios(db: Session = Depends(get_db)):
    portfolios = db.query(Portfolio).all()
    return [{
        "id": p.id,
        "user_id": p.user_id,
        "name": p.name,
        "created_at": p.created_at,
        "updated_at": p.updated_at
    } for p in portfolios]

# ==========================
# Delete a Portfolio
# ==========================
@router.delete("/portfolio/{portfolio_id}")
def delete_portfolio(portfolio_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")

    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    if portfolio.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this portfolio")

    db.delete(portfolio)
    db.commit()
    return {"message": f"Portfolio {portfolio_id} deleted successfully"}

# ==========================
# Update Portfolio Name
# ==========================
@router.put("/portfolio/{portfolio_id}")
def update_portfolio(portfolio_id: int, req: PortfolioUpdateRequest, request: Request, db: Session = Depends(get_db)):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")

    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    if portfolio.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this portfolio")

    portfolio.name = req.name
    db.commit()
    db.refresh(portfolio)

    return {"message": f"Portfolio {portfolio_id} updated", "name": portfolio.name}

# ==========================
# Portfolio Metrics
# ==========================
''' This endpoint computes various metrics for the portfolio based on historical transactions.
It uses the compute_portfolio_metrics function to calculate metrics like total return, volatility, etc.
The response includes the computed metrics. '''

@router.get("/metrics/{portfolio_id}")
def portfolio_metrics(portfolio_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")

    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio or portfolio.user_id != user_id:
        raise HTTPException(status_code=404, detail="Portfolio not found or not authorized")

    transactions = db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id).all()
    metrics = compute_portfolio_metrics(transactions)

    return {"portfolio_id": portfolio_id, "metrics": metrics}

# ==========================
# Portfolio Optimization
# ==========================
'''This endpoint optimizes the portfolio based on historical transactions and a target return.
It uses the optimization logic to determine the best asset allocation.
The target_return parameter is used to specify the desired return for the optimization.
The response includes the optimized allocation and expected metrics.'''
@router.get("/optimize/{portfolio_id}")
def optimize(portfolio_id: int, target_return: float = Query(0.20, description="Target return as a decimal, e.g., 0.08 for 8%"),
             request: Request = None, db: Session = Depends(get_db)):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")

    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio or portfolio.user_id != user_id:
        raise HTTPException(status_code=404, detail="Portfolio not found or not authorized")

    transactions = db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id).all()

    optimization_result = optimize_portfolio(transactions, target_return)

    return {
        "portfolio_id": portfolio_id,
        "target_return": target_return,
        "optimization_result": optimization_result
    }

# ==========================
# Portfolio Over Time
# ==========================
'''This endpoint computes the portfolio value over time based on historical transactions and prices.
It uses the optimization logic to simulate the portfolio's performance.
The target_return parameter is used to determine the expected return for the optimization.
The response includes both the actual and optimized portfolio values over time.'''
@router.get("/value-over-time/{portfolio_id}")
def value_over_time(portfolio_id: int, target_return: float = Query(0.08, description="Target return for optimization"),
                    request: Request = None, db: Session = Depends(get_db)):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")

    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio or portfolio.user_id != user_id:
        raise HTTPException(status_code=404, detail="Portfolio not found or not authorized")

    transactions = db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id).all()

    result = compute_value_over_time(transactions, target_return)

    return result

# ==========================
# Dollar-Cost Averaging Simulation
# ==========================
'''This endpoint simulates a dollar-cost averaging (DCA) strategy for the portfolio.
It uses the compute_value_over_time function to simulate the portfolio's performance.
The target_return parameter is used to determine the expected return for the simulation.
The response includes the simulated portfolio values over time.'''
@router.get("/dca-simulation/{portfolio_id}")
def dca_simulation(request: Request, 
                   portfolio_id: int,
                   initial_investment: float = Query(10000),
                   monthly_contribution: float = Query(500),
                   years: int = Query(10),
                   target_return: float = Query(0.10),
                   db: Session = Depends(get_db)):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")

    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio or portfolio.user_id != user_id:
        raise HTTPException(status_code=404, detail="Portfolio not found or not authorized")

    transactions = db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id).all()

    # Calculate real metrics
    actual_metrics = compute_portfolio_metrics(transactions)
    if "cagr" not in actual_metrics or actual_metrics["cagr"] == 0:
        raise HTTPException(status_code=400, detail="CAGR could not be calculated from portfolio.")
    actual_cagr = actual_metrics["cagr"]

    # Calculate optimized metrics
    optimized_result = optimize_portfolio(transactions, target_return)
    if "cagr" not in optimized_result:
        return {"message": "Optimization failed", "reason": optimized_result.get("message")}

    optimized_cagr = optimized_result["cagr"]

    # Simulate with real CAGR values
    result = simulate_dca_projection(initial_investment, monthly_contribution, years, actual_cagr, optimized_cagr)

    return result

# ==========================
# Portfolio Monthly Values
# ==========================
'''This endpoint calculates the monthly portfolio values based on historical transactions and prices.
It uses the calculate_monthly_portfolio_value function to compute the values.
The CSV file should contain the historical transactions with columns like date, ticker, action, shares, price, amount, and notes.
The response includes the start date, end date, and monthly portfolio values.'''
@router.get("/value-over-time/{portfolio_id}")
def value_over_time(portfolio_id: int, target_return: float = Query(0.08, description="Target return for optimization"),
                    request: Request = None, db: Session = Depends(get_db)):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")

    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio or portfolio.user_id != user_id:
        raise HTTPException(status_code=404, detail="Portfolio not found or not authorized")

    transactions = db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id).all()
    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions found for this portfolio")

    result = compute_value_over_time(transactions, target_return)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result