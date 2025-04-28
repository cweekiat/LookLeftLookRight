from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models import Transaction
from app.database import SessionLocal
import pandas as pd

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================
# Debug: Get All Transactions for a Portfolio
# ==========================
@router.get("/debug/transactions/{portfolio_id}")
def debug_transactions(portfolio_id: int, db: Session = Depends(get_db)):
    transactions = db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id).all()
    return [{
        "id": t.id,
        "portfolio_id": t.portfolio_id,
        "date": t.date,
        "ticker": t.ticker,
        "action": t.action,
        "shares": t.shares,
        "price": t.price,
        "amount": t.amount,
        "notes": t.notes
    } for t in transactions]

# ==========================
# Debug: Get All Transactions (Across All Portfolios)
# ==========================
@router.get("/debug/transactions")
def debug_all_transactions(db: Session = Depends(get_db)):
    transactions = db.query(Transaction).all()
    return [{
        "id": t.id,
        "portfolio_id": t.portfolio_id,
        "date": t.date,
        "ticker": t.ticker,
        "action": t.action,
        "shares": t.shares,
        "price": t.price,
        "amount": t.amount,
        "notes": t.notes
    } for t in transactions]

# ==========================
# Delete a Transaction
# ==========================
@router.delete("/transaction/{transaction_id}")
def delete_transaction(transaction_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")

    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.portfolio.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this transaction")

    db.delete(transaction)
    db.commit()
    return {"message": f"Transaction {transaction_id} deleted successfully"}

# ==========================
# Update a Transaction
# ==========================
class TransactionUpdateRequest(BaseModel):
    date: str
    ticker: str
    action: str
    shares: float
    price: float
    amount: float
    notes: str

@router.put("/transaction/{transaction_id}")
def update_transaction(transaction_id: int, req: TransactionUpdateRequest, request: Request, db: Session = Depends(get_db)):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")

    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.portfolio.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this transaction")

    transaction.date = pd.to_datetime(req.date)
    transaction.ticker = req.ticker
    transaction.action = req.action
    transaction.shares = req.shares
    transaction.price = req.price
    transaction.amount = req.amount
    transaction.notes = req.notes

    db.commit()
    db.refresh(transaction)

    return {"message": f"Transaction {transaction_id} updated"}
