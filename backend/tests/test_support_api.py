import pytest
from fastapi import status

class TestSupportAPI:
    """Test cases for support API endpoints"""
    
    def test_get_support_tickets_success(self, client, sample_support_ticket):
        """Test successful retrieval of support tickets"""
        response = client.get("/api/support_tickets/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["title"] == "Test Issue"
        assert data[0]["description"] == "This is a test support ticket"
        assert data[0]["department"] == "IT"
        assert data[0]["status"] == "open"
        assert data[0]["priority"] == "medium"
    
    def test_get_support_tickets_empty(self, client):
        """Test getting support tickets when none exist"""
        response = client.get("/api/support_tickets/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_create_support_ticket_success(self, client, regular_user):
        """Test successful support ticket creation"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Create support ticket
        response = client.post("/api/support_tickets/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "New Issue",
                "description": "This is a new support ticket",
                "department": "Sales",
                "priority": "high"
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "id" in data
        assert data["title"] == "New Issue"
        assert data["description"] == "This is a new support ticket"
        assert data["department"] == "Sales"
        assert data["priority"] == "high"
        assert data["status"] == "open"
        assert data["user_id"] == regular_user.id
    
    def test_create_support_ticket_missing_title(self, client, regular_user):
        """Test support ticket creation with missing title"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to create support ticket without title
        response = client.post("/api/support_tickets/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "description": "This is a new support ticket",
                "department": "Sales",
                "priority": "high"
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_support_ticket_missing_description(self, client, regular_user):
        """Test support ticket creation with missing description"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to create support ticket without description
        response = client.post("/api/support_tickets/", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "New Issue",
                "department": "Sales",
                "priority": "high"
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_support_ticket_unauthorized(self, client):
        """Test support ticket creation without authentication"""
        response = client.post("/api/support_tickets/", json={
            "title": "New Issue",
            "description": "This is a new support ticket",
            "department": "Sales",
            "priority": "high"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_support_ticket_by_id_success(self, client, sample_support_ticket):
        """Test successful retrieval of support ticket by ID"""
        response = client.get(f"/api/support_tickets/{sample_support_ticket.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == sample_support_ticket.id
        assert data["title"] == "Test Issue"
        assert data["description"] == "This is a test support ticket"
    
    def test_get_support_ticket_by_id_not_found(self, client):
        """Test getting non-existent support ticket by ID"""
        response = client.get("/api/support_tickets/99999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Support ticket not found" in data["detail"]
    
    def test_update_support_ticket_success(self, client, regular_user, sample_support_ticket):
        """Test successful support ticket update"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Update support ticket
        response = client.put(f"/api/support_tickets/{sample_support_ticket.id}", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Updated Issue",
                "description": "This is an updated support ticket",
                "department": "Marketing",
                "status": "in_progress",
                "priority": "urgent"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Issue"
        assert data["description"] == "This is an updated support ticket"
        assert data["department"] == "Marketing"
        assert data["status"] == "in_progress"
        assert data["priority"] == "urgent"
        assert data["id"] == sample_support_ticket.id
    
    def test_update_support_ticket_not_found(self, client, regular_user):
        """Test updating non-existent support ticket"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to update non-existent support ticket
        response = client.put("/api/support_tickets/99999", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Updated Issue",
                "description": "This is an updated support ticket",
                "department": "Marketing",
                "status": "in_progress",
                "priority": "urgent"
            }
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Support ticket not found" in data["detail"]
    
    def test_update_support_ticket_unauthorized(self, client, sample_support_ticket):
        """Test support ticket update without authentication"""
        response = client.put(f"/api/support_tickets/{sample_support_ticket.id}", json={
            "title": "Updated Issue",
            "description": "This is an updated support ticket",
            "department": "Marketing",
            "status": "in_progress",
            "priority": "urgent"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_support_ticket_success(self, client, regular_user, sample_support_ticket):
        """Test successful support ticket deletion"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Delete support ticket
        response = client.delete(f"/api/support_tickets/{sample_support_ticket.id}", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "Support ticket deleted successfully" in data["message"]
    
    def test_delete_support_ticket_not_found(self, client, regular_user):
        """Test deleting non-existent support ticket"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        # Try to delete non-existent support ticket
        response = client.delete("/api/support_tickets/99999", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Support ticket not found" in data["detail"]
    
    def test_delete_support_ticket_unauthorized(self, client, sample_support_ticket):
        """Test support ticket deletion without authentication"""
        response = client.delete(f"/api/support_tickets/{sample_support_ticket.id}")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_support_tickets_by_status(self, client, sample_support_ticket):
        """Test getting support tickets by status"""
        response = client.get("/api/support_tickets/status/open")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["status"] == "open"
    
    def test_get_support_tickets_by_status_no_results(self, client, sample_support_ticket):
        """Test getting support tickets by status with no results"""
        response = client.get("/api/support_tickets/status/resolved")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_support_tickets_by_department(self, client, sample_support_ticket):
        """Test getting support tickets by department"""
        response = client.get("/api/support_tickets/department/IT")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["department"] == "IT"
    
    def test_get_support_tickets_by_department_no_results(self, client, sample_support_ticket):
        """Test getting support tickets by department with no results"""
        response = client.get("/api/support_tickets/department/Sales")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_support_tickets_by_user(self, client, regular_user, sample_support_ticket):
        """Test getting support tickets by user"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get(f"/api/support_tickets/user/{regular_user.id}", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["user_id"] == regular_user.id
    
    def test_get_support_tickets_by_user_unauthorized(self, client, regular_user, sample_support_ticket):
        """Test getting support tickets by user without authentication"""
        response = client.get(f"/api/support_tickets/user/{regular_user.id}")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_support_tickets_by_user_not_found(self, client, regular_user):
        """Test getting support tickets by non-existent user"""
        # First login to get token
        login_response = client.post("/api/auth/login", data={
            "username": "user",
            "password": "user123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/support_tickets/user/99999", 
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


