from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from database import Base


Base = declarative_base()



class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String, index=True)
    description = Column(String)
    mood = Column(String)
    type = Column(String, default="expense")

    # Harcamayı kullanıcıya bağlayan yabancı anahtar
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) 
    
    # Harcamanın sahibine ulaşmak için ilişki
    owner = relationship("User", back_populates="transactions")


class Budget(Base):
    """Kategori Bazlı Bütçe Limitleri"""
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)   
    monthly_limit = Column(Float)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False) 

    
    transactions = relationship("Transaction", back_populates="owner")

    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")



class Goal(Base):
    __tablename__ = "goals"


    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # user tablonun adı neyse
    name = Column(String, nullable=False)
    target = Column(Float, nullable=False)
    current = Column(Float, default=0.0)
    color = Column(String, default="#14b8a6")
    priority = Column(Integer, default=1)

    # Eğer user ilişkisi varsa aynen bırak:
    user = relationship("User", back_populates="goals")
    