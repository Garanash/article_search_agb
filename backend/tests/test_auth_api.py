import pytest
from fastapi import status
from app.auth import create_access_token, get_password_hash

class TestAuthAPI:
    """Test cases for authentication API endpoints"""
    
    def test_login_success(self, client, regular_user):
        """Test successful user login"""
        response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == "user"
        assert data["user"]["role"] == "user"
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post("/api/auth/login", data={
            "username": "invalid",
            "password": "wrongpassword"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert "detail" in data
        assert "Incorrect username or password" in data["detail"]
    
    def test_login_missing_username(self, client):
        """Test login with missing username"""
        response = client.post("/api/auth/login", data={
            "password": "user123"
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_login_missing_password(self, client):
        """Test login with missing password"""
        response = client.post("/api/auth/login", data={
            "username": "user"
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "newpassword123",
            "first_name": "New",
            "last_name": "User",
            "department": "IT"
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "id" in data
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@test.com"
        assert data["role"] == "user"
        assert "hashed_password" not in data
    
    def test_register_duplicate_username(self, client, regular_user):
        """Test registration with duplicate username"""
        response = client.post("/api/auth/register", json={
            "username": "user",  # Already exists
            "email": "different@test.com",
            "password": "password123",
            "first_name": "Different",
            "last_name": "User"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "detail" in data
        assert "Username already registered" in data["detail"]
    
    def test_register_duplicate_email(self, client, regular_user):
        """Test registration with duplicate email"""
        response = client.post("/api/auth/register", json={
            "username": "differentuser",
            "email": "user@test.com",  # Already exists
            "password": "password123",
            "first_name": "Different",
            "last_name": "User"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "detail" in data
        assert "Email already registered" in data["detail"]
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        response = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "invalid-email",
            "password": "password123",
            "first_name": "New",
            "last_name": "User"
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_register_weak_password(self, client):
        """Test registration with weak password"""
        response = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "123",  # Too short
            "first_name": "New",
            "last_name": "User"
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_get_current_user_success(self, client, regular_user):
        """Test getting current user with valid token"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Use token to get current user
        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "user"
        assert data["email"] == "user@test.com"
        assert data["role"] == "user"
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer invalid-token"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user_no_token(self, client):
        """Test getting current user without token"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_change_password_success(self, client, regular_user):
        """Test successful password change"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Change password
        response = client.post("/api/auth/change-password", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "current_password": "user123",
                "new_password": "newpassword123"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "Password changed successfully" in data["message"]
    
    def test_change_password_wrong_current_password(self, client, regular_user):
        """Test password change with wrong current password"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to change password with wrong current password
        response = client.post("/api/auth/change-password", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword123"
            }
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "detail" in data
        assert "Current password is incorrect" in data["detail"]
    
    def test_change_password_weak_new_password(self, client, regular_user):
        """Test password change with weak new password"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to change password with weak new password
        response = client.post("/api/auth/change-password", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "current_password": "user123",
                "new_password": "123"  # Too short
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


