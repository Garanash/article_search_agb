import pytest
from fastapi import status

class TestUsersAPI:
    """Test cases for users API endpoints"""
    
    def test_get_users_success(self, client, admin_user, regular_user):
        """Test successful retrieval of users"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/users/", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # admin + regular user
        assert any(user["username"] == "admin" for user in data)
        assert any(user["username"] == "user" for user in data)
    
    def test_get_users_unauthorized(self, client):
        """Test getting users without authentication"""
        response = client.get("/api/users/")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_users_insufficient_permissions(self, client, regular_user):
        """Test getting users with insufficient permissions"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/users/", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "detail" in data
        assert "Недостаточно прав доступа" in data["detail"]
    
    def test_get_user_by_id_success(self, client, admin_user, regular_user):
        """Test successful retrieval of user by ID"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get(f"/api/users/{regular_user.id}", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == regular_user.id
        assert data["username"] == "user"
        assert data["email"] == "user@test.com"
        assert data["role"] == "user"
    
    def test_get_user_by_id_not_found(self, client, admin_user):
        """Test getting non-existent user by ID"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/users/99999", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "User not found" in data["detail"]
    
    def test_get_user_by_id_unauthorized(self, client, regular_user):
        """Test getting user by ID without authentication"""
        response = client.get(f"/api/users/{regular_user.id}")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_user_by_id_insufficient_permissions(self, client, regular_user):
        """Test getting user by ID with insufficient permissions"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get(f"/api/users/{regular_user.id}", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "detail" in data
        assert "Недостаточно прав доступа" in data["detail"]
    
    def test_create_user_success(self, client, admin_user):
        """Test successful user creation"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/users/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "newuser",
                "email": "newuser@test.com",
                "password": "newpassword123",
                "first_name": "New",
                "last_name": "User",
                "role": "user",
                "department": "Sales"
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "id" in data
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@test.com"
        assert data["role"] == "user"
        assert data["department"] == "Sales"
        assert "hashed_password" not in data
    
    def test_create_user_duplicate_username(self, client, admin_user, regular_user):
        """Test user creation with duplicate username"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/users/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "user",  # Already exists
                "email": "different@test.com",
                "password": "password123",
                "first_name": "Different",
                "last_name": "User",
                "role": "user"
            }
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "detail" in data
        assert "Username already registered" in data["detail"]
    
    def test_create_user_duplicate_email(self, client, admin_user, regular_user):
        """Test user creation with duplicate email"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/users/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "differentuser",
                "email": "user@test.com",  # Already exists
                "password": "password123",
                "first_name": "Different",
                "last_name": "User",
                "role": "user"
            }
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "detail" in data
        assert "Email already registered" in data["detail"]
    
    def test_create_user_unauthorized(self, client):
        """Test user creation without authentication"""
        response = client.post("/api/users/", json={
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "newpassword123",
            "first_name": "New",
            "last_name": "User",
            "role": "user"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_user_insufficient_permissions(self, client, regular_user):
        """Test user creation with insufficient permissions"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/users/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "newuser",
                "email": "newuser@test.com",
                "password": "newpassword123",
                "first_name": "New",
                "last_name": "User",
                "role": "user"
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "detail" in data
        assert "Недостаточно прав доступа" in data["detail"]
    
    def test_update_user_success(self, client, admin_user, regular_user):
        """Test successful user update"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.put(f"/api/users/{regular_user.id}", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "updateduser",
                "email": "updated@test.com",
                "first_name": "Updated",
                "last_name": "User",
                "role": "user",
                "department": "Marketing"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "updateduser"
        assert data["email"] == "updated@test.com"
        assert data["first_name"] == "Updated"
        assert data["last_name"] == "User"
        assert data["department"] == "Marketing"
        assert data["id"] == regular_user.id
    
    def test_update_user_not_found(self, client, admin_user):
        """Test updating non-existent user"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.put("/api/users/99999", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "updateduser",
                "email": "updated@test.com",
                "first_name": "Updated",
                "last_name": "User",
                "role": "user"
            }
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "User not found" in data["detail"]
    
    def test_update_user_unauthorized(self, client, regular_user):
        """Test user update without authentication"""
        response = client.put(f"/api/users/{regular_user.id}", json={
            "username": "updateduser",
            "email": "updated@test.com",
            "first_name": "Updated",
            "last_name": "User",
            "role": "user"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_update_user_insufficient_permissions(self, client, regular_user):
        """Test user update with insufficient permissions"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.put(f"/api/users/{regular_user.id}", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "updateduser",
                "email": "updated@test.com",
                "first_name": "Updated",
                "last_name": "User",
                "role": "user"
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "detail" in data
        assert "Недостаточно прав доступа" in data["detail"]
    
    def test_delete_user_success(self, client, admin_user, regular_user):
        """Test successful user deletion"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.delete(f"/api/users/{regular_user.id}", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "User deleted successfully" in data["message"]
    
    def test_delete_user_not_found(self, client, admin_user):
        """Test deleting non-existent user"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.delete("/api/users/99999", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "User not found" in data["detail"]
    
    def test_delete_user_unauthorized(self, client, regular_user):
        """Test user deletion without authentication"""
        response = client.delete(f"/api/users/{regular_user.id}")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_user_insufficient_permissions(self, client, regular_user):
        """Test user deletion with insufficient permissions"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.delete(f"/api/users/{regular_user.id}", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "detail" in data
        assert "Недостаточно прав доступа" in data["detail"]
    
    def test_reset_user_password_success(self, client, admin_user, regular_user):
        """Test successful user password reset"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post(f"/api/users/{regular_user.id}/reset-password", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "Password reset successfully" in data["message"]
        assert "new_password" in data
    
    def test_reset_user_password_not_found(self, client, admin_user):
        """Test password reset for non-existent user"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/users/99999/reset-password", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "User not found" in data["detail"]
    
    def test_reset_user_password_unauthorized(self, client, regular_user):
        """Test user password reset without authentication"""
        response = client.post(f"/api/users/{regular_user.id}/reset-password")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_reset_user_password_insufficient_permissions(self, client, regular_user):
        """Test user password reset with insufficient permissions"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post(f"/api/users/{regular_user.id}/reset-password", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "detail" in data
        assert "Недостаточно прав доступа" in data["detail"]
    
    def test_deactivate_user_success(self, client, admin_user, regular_user):
        """Test successful user deactivation"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post(f"/api/users/{regular_user.id}/deactivate", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "User deactivated successfully" in data["message"]
    
    def test_activate_user_success(self, client, admin_user, regular_user):
        """Test successful user activation"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post(f"/api/users/{regular_user.id}/activate", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "User activated successfully" in data["message"]
    
    def test_mark_user_for_deletion_success(self, client, admin_user, regular_user):
        """Test successful user marking for deletion"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post(f"/api/users/{regular_user.id}/mark-for-deletion", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "User marked for deletion successfully" in data["message"]


