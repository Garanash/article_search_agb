import pytest
from fastapi import status

class TestAdminAPI:
    """Test cases for admin API endpoints"""
    
    def test_get_admin_metrics_success(self, client, admin_user):
        """Test successful retrieval of admin metrics"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/admin/metrics", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "users" in data
        assert "articles" in data
        assert "requests" in data
        assert "suppliers" in data
        assert "tickets" in data
        assert "open_tickets" in data
        assert "recent_users" in data
        assert "recent_requests" in data
        assert "users_by_role" in data
        assert "events" in data
        assert "documents" in data
    
    def test_get_admin_metrics_unauthorized(self, client):
        """Test getting admin metrics without authentication"""
        response = client.get("/api/admin/metrics")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_admin_metrics_insufficient_permissions(self, client, regular_user):
        """Test getting admin metrics with insufficient permissions"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/admin/metrics", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "detail" in data
        assert "Недостаточно прав доступа" in data["detail"]
    
    def test_get_admin_stats_success(self, client, admin_user):
        """Test successful retrieval of admin stats (alias for metrics)"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/admin/stats", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "users" in data
        assert "articles" in data
        assert "requests" in data
        assert "suppliers" in data
        assert "tickets" in data
        assert "open_tickets" in data
    
    def test_get_admin_stats_unauthorized(self, client):
        """Test getting admin stats without authentication"""
        response = client.get("/api/admin/stats")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_table_data_users_success(self, client, admin_user, regular_user):
        """Test successful retrieval of users table data"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/admin/table/users", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # admin + regular user
        assert any(user["username"] == "admin" for user in data)
        assert any(user["username"] == "user" for user in data)
    
    def test_get_table_data_articles_success(self, client, admin_user, sample_article):
        """Test successful retrieval of articles table data"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/admin/table/articles", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["code"] == "TEST001"
    
    def test_get_table_data_support_tickets_success(self, client, admin_user, sample_support_ticket):
        """Test successful retrieval of support tickets table data"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/admin/table/tickets", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["title"] == "Test Issue"
    
    def test_get_table_data_nonexistent_table(self, client, admin_user):
        """Test getting data from non-existent table"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/admin/table/nonexistent", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Таблица nonexistent не найдена" in data["detail"]
    
    def test_get_table_data_unauthorized(self, client):
        """Test getting table data without authentication"""
        response = client.get("/api/admin/table/users")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_table_data_insufficient_permissions(self, client, regular_user):
        """Test getting table data with insufficient permissions"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/admin/table/users", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "detail" in data
        assert "Недостаточно прав доступа" in data["detail"]
    
    def test_add_table_record_users_success(self, client, admin_user):
        """Test successful addition of user record"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/admin/table/users", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "newadmin",
                "email": "newadmin@test.com",
                "hashed_password": "hashed_password_here",
                "role": "admin",
                "department": "IT",
                "first_name": "New",
                "last_name": "Admin"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "Запись добавлена" in data["message"]
        assert "id" in data
    
    def test_add_table_record_articles_success(self, client, admin_user, regular_user):
        """Test successful addition of article record"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/admin/table/articles", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "code": "ADMIN001",
                "user_id": regular_user.id
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "Запись добавлена" in data["message"]
        assert "id" in data
    
    def test_add_table_record_nonexistent_table(self, client, admin_user):
        """Test adding record to non-existent table"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/admin/table/nonexistent", 
            headers={"Authorization": f"Bearer {token}"},
            json={"test": "data"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Таблица nonexistent не найдена" in data["detail"]
    
    def test_add_table_record_unauthorized(self, client):
        """Test adding table record without authentication"""
        response = client.post("/api/admin/table/users", json={
            "username": "newuser",
            "email": "newuser@test.com"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_add_table_record_insufficient_permissions(self, client, regular_user):
        """Test adding table record with insufficient permissions"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/admin/table/users", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "newuser",
                "email": "newuser@test.com"
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "detail" in data
        assert "Недостаточно прав доступа" in data["detail"]
    
    def test_add_table_record_invalid_data(self, client, admin_user):
        """Test adding table record with invalid data"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/admin/table/users", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "",  # Empty username
                "email": "invalid-email"
            }
        )
        
        # This should fail due to validation
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    def test_admin_metrics_with_data(self, client, admin_user, regular_user, sample_article, sample_support_ticket):
        """Test admin metrics with actual data"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/admin/metrics", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Check that metrics reflect actual data
        assert data["users"] >= 2  # admin + regular user
        assert data["articles"] >= 1  # sample article
        assert data["tickets"] >= 1  # sample support ticket
        assert data["open_tickets"] >= 1  # sample support ticket is open
        assert "admin" in data["users_by_role"]
        assert "user" in data["users_by_role"]


