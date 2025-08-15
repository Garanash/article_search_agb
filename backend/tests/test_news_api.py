import pytest
from fastapi import status

class TestNewsAPI:
    """Test cases for news API endpoints"""
    
    def test_get_news_success(self, client, sample_news):
        """Test successful retrieval of news"""
        response = client.get("/api/news/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["title"] == "Test News"
        assert data[0]["text"] == "This is test news content"
        assert data[0]["image_url"] == "https://example.com/image.jpg"
    
    def test_get_news_empty(self, client):
        """Test getting news when none exist"""
        response = client.get("/api/news/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_create_news_success(self, client, regular_user):
        """Test successful news creation"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Create news
        response = client.post("/api/news/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "New News",
                "text": "This is new news content",
                "image_url": "https://example.com/new-image.jpg"
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "id" in data
        assert data["title"] == "New News"
        assert data["text"] == "This is new news content"
        assert data["image_url"] == "https://example.com/new-image.jpg"
        assert data["author_id"] == regular_user.id
    
    def test_create_news_missing_title(self, client, regular_user):
        """Test news creation with missing title"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to create news without title
        response = client.post("/api/news/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "text": "This is new news content",
                "image_url": "https://example.com/new-image.jpg"
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_news_missing_text(self, client, regular_user):
        """Test news creation with missing text"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to create news without text
        response = client.post("/api/news/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "New News",
                "image_url": "https://example.com/new-image.jpg"
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_news_unauthorized(self, client):
        """Test news creation without authentication"""
        response = client.post("/api/news/", json={
            "title": "New News",
            "text": "This is new news content",
            "image_url": "https://example.com/new-image.jpg"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_news_by_id_success(self, client, sample_news):
        """Test successful retrieval of news by ID"""
        response = client.get(f"/api/news/{sample_news.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == sample_news.id
        assert data["title"] == "Test News"
        assert data["text"] == "This is test news content"
    
    def test_get_news_by_id_not_found(self, client):
        """Test getting non-existent news by ID"""
        response = client.get("/api/news/99999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "News not found" in data["detail"]
    
    def test_update_news_success(self, client, regular_user, sample_news):
        """Test successful news update"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Update news
        response = client.put(f"/api/news/{sample_news.id}", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Updated News",
                "text": "This is updated news content",
                "image_url": "https://example.com/updated-image.jpg"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated News"
        assert data["text"] == "This is updated news content"
        assert data["image_url"] == "https://example.com/updated-image.jpg"
        assert data["id"] == sample_news.id
    
    def test_update_news_not_found(self, client, regular_user):
        """Test updating non-existent news"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to update non-existent news
        response = client.put("/api/news/99999", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Updated News",
                "text": "This is updated news content",
                "image_url": "https://example.com/updated-image.jpg"
            }
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "News not found" in data["detail"]
    
    def test_update_news_unauthorized(self, client, sample_news):
        """Test news update without authentication"""
        response = client.put(f"/api/news/{sample_news.id}", json={
            "title": "Updated News",
            "text": "This is updated news content",
            "image_url": "https://example.com/updated-image.jpg"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_news_success(self, client, regular_user, sample_news):
        """Test successful news deletion"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Delete news
        response = client.delete(f"/api/news/{sample_news.id}", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "News deleted successfully" in data["message"]
    
    def test_delete_news_not_found(self, client, regular_user):
        """Test deleting non-existent news"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to delete non-existent news
        response = client.delete("/api/news/99999", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "News not found" in data["detail"]
    
    def test_delete_news_unauthorized(self, client, sample_news):
        """Test news deletion without authentication"""
        response = client.delete(f"/api/news/{sample_news.id}")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_news_without_image(self, client, regular_user):
        """Test news creation without image URL"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Create news without image
        response = client.post("/api/news/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "News Without Image",
                "text": "This is news content without image"
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "News Without Image"
        assert data["text"] == "This is news content without image"
        assert data["image_url"] is None
    
    def test_update_news_partial(self, client, regular_user, sample_news):
        """Test partial news update"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Update only title
        response = client.put(f"/api/news/{sample_news.id}", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Partially Updated News",
                "text": "This is test news content",
                "image_url": "https://example.com/image.jpg"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Partially Updated News"
        assert data["text"] == "This is test news content"  # Unchanged
        assert data["image_url"] == "https://example.com/image.jpg"  # Unchanged


