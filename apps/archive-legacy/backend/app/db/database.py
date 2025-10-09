"""
Aurora RobbieVerse - Database Connection
"""
import databases
import sqlalchemy
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import get_settings

settings = get_settings()

# Database connection
database = databases.Database(settings.database_url)

# SQLAlchemy engine
engine = sqlalchemy.create_engine(settings.database_url)

# Base class for ORM models
Base = declarative_base()

# Metadata for table creation
metadata = Base.metadata
