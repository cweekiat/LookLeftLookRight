from sqlalchemy.orm import Session
from app.models import Portfolio, User

def get_user_portfolios(db: Session, user_id: str):
    return db.query(Portfolio).filter(Portfolio.user_id == user_id).all()

def get_portfolio(db: Session, portfolio_id: int):
    return db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()

def create_portfolio(db: Session, user_id: str, name: str = "Default Portfolio"):
    portfolio = Portfolio(user_id=user_id, name=name)
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio

def update_portfolio_name(db: Session, portfolio: Portfolio, new_name: str):
    portfolio.name = new_name
    db.commit()
    db.refresh(portfolio)
    return portfolio

def delete_portfolio(db: Session, portfolio: Portfolio):
    db.delete(portfolio)
    db.commit()
