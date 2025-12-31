import pytest


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        response = client.get("/api/v1/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data


class TestAnalyzeEndpoint:
    def test_analyze_valid_url(self, client):
        response = client.post(
            "/api/v1/analyze",
            json={"url": "https://example.com"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "risk_level" in data
        assert "risk_score" in data
        assert "homograph" in data
        assert "domain_age" in data
        assert "ssl" in data
        assert "brand_similarity" in data
        assert "recommendations" in data

    def test_analyze_invalid_url_format(self, client):
        response = client.post(
            "/api/v1/analyze",
            json={"url": "not-a-valid-url"}
        )
        
        assert response.status_code == 422

    def test_analyze_with_html_content(self, client, sample_html_with_form):
        response = client.post(
            "/api/v1/analyze",
            json={
                "url": "https://suspicious-site.com",
                "html_content": sample_html_with_form
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["form_analysis"] is not None
        assert data["form_analysis"]["password_fields"] >= 1
        assert len(data["form_analysis"]["external_actions"]) > 0

    def test_analyze_suspicious_domain(self, client):
        response = client.post(
            "/api/v1/analyze",
            json={"url": "https://paypa1-secure.com"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["brand_similarity"]["is_suspicious"] is True
        assert data["risk_score"] > 20


class TestBrandsEndpoint:
    def test_list_brands(self, client):
        response = client.get("/api/v1/brands")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_brands" in data
        assert "categories" in data
        assert data["total_brands"] > 50
