from sqlalchemy.orm import Session
from app.models import Transaction

def get_transactions_by_portfolio(db: Session, portfolio_id: int):
    return db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id).all()

def get_transaction(db: Session, transaction_id: int):
    return db.query(Transaction).filter(Transaction.id == transaction_id).first()

def update_transaction(db: Session, transaction: Transaction, updated_data: dict):
    for key, value in updated_data.items():
        setattr(transaction, key, value)
    db.commit()
    db.refresh(transaction)
    return transaction

def delete_transaction(db: Session, transaction: Transaction):
    db.delete(transaction)
    db.commit()
