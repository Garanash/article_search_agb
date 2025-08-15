import pytest
from fastapi import status

class TestArticlesAPI:
    """Test cases for articles API endpoints"""
    
    def test_get_articles_success(self, client, sample_article):
        """Test successful retrieval of articles"""
        response = client.get("/api/articles/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["code"] == "TEST001"
        assert data[0]["id"] == sample_article.id
    
    def test_get_articles_empty(self, client):
        """Test getting articles when none exist"""
        response = client.get("/api/articles/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_create_article_success(self, client, regular_user):
        """Test successful article creation"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Create article
        response = client.post("/api/articles/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "code": "NEW001",
                "request_id": None
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "id" in data
        assert data["code"] == "NEW001"
        assert data["user_id"] == regular_user.id
    
    def test_create_article_duplicate_code(self, client, regular_user, sample_article):
        """Test article creation with duplicate code"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to create article with duplicate code
        response = client.post("/api/articles/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "code": "TEST001",  # Already exists
                "request_id": None
            }
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "detail" in data
        assert "Article with this code already exists" in data["detail"]
    
    def test_create_article_missing_code(self, client, regular_user):
        """Test article creation with missing code"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to create article without code
        response = client.post("/api/articles/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "request_id": None
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_article_unauthorized(self, client):
        """Test article creation without authentication"""
        response = client.post("/api/articles/", json={
            "code": "NEW001",
            "request_id": None
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_article_by_id_success(self, client, sample_article):
        """Test successful retrieval of article by ID"""
        response = client.get(f"/api/articles/{sample_article.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == sample_article.id
        assert data["code"] == "TEST001"
    
    def test_get_article_by_id_not_found(self, client):
        """Test getting non-existent article by ID"""
        response = client.get("/api/articles/99999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Article not found" in data["detail"]
    
    def test_update_article_success(self, client, regular_user, sample_article):
        """Test successful article update"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Update article
        response = client.put(f"/api/articles/{sample_article.id}", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "code": "UPDATED001",
                "request_id": None
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["code"] == "UPDATED001"
        assert data["id"] == sample_article.id
    
    def test_update_article_not_found(self, client, regular_user):
        """Test updating non-existent article"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to update non-existent article
        response = client.put("/api/articles/99999", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "code": "UPDATED001",
                "request_id": None
            }
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Article not found" in data["detail"]
    
    def test_update_article_unauthorized(self, client, sample_article):
        """Test article update without authentication"""
        response = client.put(f"/api/articles/{sample_article.id}", json={
            "code": "UPDATED001",
            "request_id": None
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_article_success(self, client, regular_user, sample_article):
        """Test successful article deletion"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Delete article
        response = client.delete(f"/api/articles/{sample_article.id}", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "Article deleted successfully" in data["message"]
    
    def test_delete_article_not_found(self, client, regular_user):
        """Test deleting non-existent article"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to delete non-existent article
        response = client.delete("/api/articles/99999", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Article not found" in data["detail"]
    
    def test_delete_article_unauthorized(self, client, sample_article):
        """Test article deletion without authentication"""
        response = client.delete(f"/api/articles/{sample_article.id}")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_articles_by_request(self, client, sample_article, sample_request):
        """Test getting articles by request ID"""
        # Update article to have request_id
        sample_article.request_id = sample_request.id
        
        response = client.get(f"/api/articles/request/{sample_request.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == sample_article.id
        assert data[0]["request_id"] == sample_request.id
    
    def test_get_articles_by_request_empty(self, client, sample_request):
        """Test getting articles by request ID when none exist"""
        response = client.get(f"/api/articles/request/{sample_request.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_articles_by_request_not_found(self, client):
        """Test getting articles by non-existent request ID"""
        response = client.get("/api/articles/request/99999")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


