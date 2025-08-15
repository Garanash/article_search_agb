import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.main import app
from app.models import User, Role, Department, Article, Supplier, Request, SupportTicket, News, PhoneBook
from app.auth import get_password_hash

# Test database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    yield session
    
    # Cleanup
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with test database"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

@pytest.fixture
def admin_user(db_session):
    """Create an admin user for testing"""
    # Create admin role
    admin_role = Role(name="admin", description="Administrator")
    db_session.add(admin_role)
    
    # Create admin department
    admin_dept = Department(name="IT", description="Information Technology")
    db_session.add(admin_dept)
    
    db_session.commit()
    
    # Create admin user
    admin_user = User(
        username="admin",
        email="admin@test.com",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        department="IT",
        first_name="Admin",
        last_name="User"
    )
    db_session.add(admin_user)
    db_session.commit()
    
    return admin_user

@pytest.fixture
def regular_user(db_session):
    """Create a regular user for testing"""
    # Create user role
    user_role = Role(name="user", description="Regular User")
    db_session.add(user_role)
    
    # Create user department
    user_dept = Department(name="Sales", description="Sales Department")
    db_session.add(user_dept)
    
    db_session.commit()
    
    # Create regular user
    user = User(
        username="user",
        email="user@test.com",
        hashed_password=get_password_hash("user123"),
        role="user",
        department="Sales",
        first_name="Regular",
        last_name="User"
    )
    db_session.add(user)
    db_session.commit()
    
    return user

@pytest.fixture
def sample_article(db_session, regular_user):
    """Create a sample article for testing"""
    article = Article(
        code="TEST001",
        user_id=regular_user.id
    )
    db_session.add(article)
    db_session.commit()
    return article

@pytest.fixture
def sample_supplier(db_session, sample_article, regular_user):
    """Create a sample supplier for testing"""
    supplier = Supplier(
        article_id=sample_article.id,
        user_id=regular_user.id,
        name="Test Supplier",
        website="https://testsupplier.com",
        email="supplier@testsupplier.com",
        country="Test Country"
    )
    db_session.add(supplier)
    db_session.commit()
    return supplier

@pytest.fixture
def sample_request(db_session, regular_user):
    """Create a sample request for testing"""
    request = Request(
        number="REQ001",
        user_id=regular_user.id
    )
    db_session.add(request)
    db_session.commit()
    return request

@pytest.fixture
def sample_support_ticket(db_session, regular_user):
    """Create a sample support ticket for testing"""
    ticket = SupportTicket(
        user_id=regular_user.id,
        title="Test Issue",
        description="This is a test support ticket",
        department="IT",
        status="open",
        priority="medium"
    )
    db_session.add(ticket)
    db_session.commit()
    return ticket

@pytest.fixture
def sample_news(db_session):
    """Create a sample news item for testing"""
    news = News(
        title="Test News",
        text="This is test news content",
        image_url="https://example.com/image.jpg"
    )
    db_session.add(news)
    db_session.commit()
    return news

@pytest.fixture
def sample_phone_book(db_session):
    """Create a sample phone book entry for testing"""
    phone_entry = PhoneBook(
        full_name="Test User",
        department="IT",
        position="Developer",
        phone="+1234567890",
        email="test@example.com"
    )
    db_session.add(phone_entry)
    db_session.commit()
    return phone_entry


