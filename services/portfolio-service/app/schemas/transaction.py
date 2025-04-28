from pydantic import BaseModel

class TransactionUpdateRequest(BaseModel):
    date: str
    ticker: str
    action: str
    shares: float
    price: float
    amount: float
    notes: str
