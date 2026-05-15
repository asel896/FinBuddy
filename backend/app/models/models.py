from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    category = Column(String)
    description = Column(String)
    type = Column(String) # expense veya income
    mood = Column(String, nullable=True)  # <-- BU SATIRI EKLE
    date = Column(DateTime, default=datetime.utcnow)

class Goal(Base):
    """Birikim Hedefleri"""
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)      
    target_amount = Column(Float)
    current_amount = Column(Float, default=0.0)
    deadline = Column(DateTime)

class Budget(Base):
    """Kategori Bazlı Bütçe Limitleri"""
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)   
    monthly_limit = Column(Float)