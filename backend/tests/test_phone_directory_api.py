import pytest
from fastapi import status

class TestPhoneDirectoryAPI:
    """Test cases for phone directory API endpoints"""
    
    def test_get_phone_directory_success(self, client, sample_phone_book):
        """Test successful retrieval of phone directory"""
        response = client.get("/api/phone-directory/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["full_name"] == "Test User"
        assert data[0]["department"] == "IT"
        assert data[0]["position"] == "Developer"
        assert data[0]["phone"] == "+1234567890"
        assert data[0]["email"] == "test@example.com"
    
    def test_get_phone_directory_empty(self, client):
        """Test getting phone directory when none exist"""
        response = client.get("/api/phone-directory/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_create_phone_entry_success(self, client):
        """Test successful phone directory entry creation"""
        response = client.post("/api/phone-directory/", json={
            "full_name": "New User",
            "department": "Sales",
            "position": "Manager",
            "phone": "+0987654321",
            "email": "newuser@example.com"
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "id" in data
        assert data["full_name"] == "New User"
        assert data["department"] == "Sales"
        assert data["position"] == "Manager"
        assert data["phone"] == "+0987654321"
        assert data["email"] == "newuser@example.com"
    
    def test_create_phone_entry_missing_required_fields(self, client):
        """Test phone directory entry creation with missing required fields"""
        response = client.post("/api/phone-directory/", json={
            "department": "Sales",
            "position": "Manager"
            # Missing full_name
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_phone_entry_invalid_email(self, client):
        """Test phone directory entry creation with invalid email"""
        response = client.post("/api/phone-directory/", json={
            "full_name": "New User",
            "department": "Sales",
            "position": "Manager",
            "phone": "+0987654321",
            "email": "invalid-email"
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_get_phone_entry_by_id_success(self, client, sample_phone_book):
        """Test successful retrieval of phone directory entry by ID"""
        response = client.get(f"/api/phone-directory/{sample_phone_book.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == sample_phone_book.id
        assert data["full_name"] == "Test User"
        assert data["department"] == "IT"
    
    def test_get_phone_entry_by_id_not_found(self, client):
        """Test getting non-existent phone directory entry by ID"""
        response = client.get("/api/phone-directory/99999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Phone directory entry not found" in data["detail"]
    
    def test_update_phone_entry_success(self, client, sample_phone_book):
        """Test successful phone directory entry update"""
        response = client.put(f"/api/phone-directory/{sample_phone_book.id}", json={
            "full_name": "Updated User",
            "department": "Marketing",
            "position": "Senior Developer",
            "phone": "+1111111111",
            "email": "updated@example.com"
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["full_name"] == "Updated User"
        assert data["department"] == "Marketing"
        assert data["position"] == "Senior Developer"
        assert data["phone"] == "+1111111111"
        assert data["email"] == "updated@example.com"
        assert data["id"] == sample_phone_book.id
    
    def test_update_phone_entry_not_found(self, client):
        """Test updating non-existent phone directory entry"""
        response = client.put("/api/phone-directory/99999", json={
            "full_name": "Updated User",
            "department": "Marketing",
            "position": "Senior Developer",
            "phone": "+1111111111",
            "email": "updated@example.com"
        })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Phone directory entry not found" in data["detail"]
    
    def test_update_phone_entry_invalid_data(self, client, sample_phone_book):
        """Test phone directory entry update with invalid data"""
        response = client.put(f"/api/phone-directory/{sample_phone_book.id}", json={
            "full_name": "",  # Empty name
            "department": "Marketing",
            "position": "Senior Developer",
            "phone": "+1111111111",
            "email": "invalid-email"
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_delete_phone_entry_success(self, client, sample_phone_book):
        """Test successful phone directory entry deletion"""
        response = client.delete(f"/api/phone-directory/{sample_phone_book.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "Phone directory entry deleted successfully" in data["message"]
    
    def test_delete_phone_entry_not_found(self, client):
        """Test deleting non-existent phone directory entry"""
        response = client.delete("/api/phone-directory/99999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert "Phone directory entry not found" in data["detail"]
    
    def test_search_phone_directory_success(self, client, sample_phone_book):
        """Test successful phone directory search"""
        response = client.get("/api/phone-directory/search?q=Test")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["full_name"] == "Test User"
    
    def test_search_phone_directory_no_results(self, client, sample_phone_book):
        """Test phone directory search with no results"""
        response = client.get("/api/phone-directory/search?q=Nonexistent")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_search_phone_directory_empty_query(self, client, sample_phone_book):
        """Test phone directory search with empty query"""
        response = client.get("/api/phone-directory/search?q=")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1  # Should return all entries
    
    def test_get_phone_directory_by_department_success(self, client, sample_phone_book):
        """Test getting phone directory entries by department"""
        response = client.get("/api/phone-directory/department/IT")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["department"] == "IT"
    
    def test_get_phone_directory_by_department_no_results(self, client, sample_phone_book):
        """Test getting phone directory entries by non-existent department"""
        response = client.get("/api/phone-directory/department/Nonexistent")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_phone_directory_by_department_empty(self, client):
        """Test getting phone directory entries by department when none exist"""
        response = client.get("/api/phone-directory/department/IT")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


