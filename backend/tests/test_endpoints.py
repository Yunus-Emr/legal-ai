"""
Document & Health Endpoint Testleri
"""
import pytest
from unittest.mock import patch, AsyncMock


class TestHealth:
    async def test_health_returns_status(self, client):
        """Health endpoint auth gerektirmez."""
        with patch("app.vectorstore.opensearch_client.opensearch_client") as mock_os:
            mock_os.ping = AsyncMock(return_value=True)
            res = await client.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert "status" in data
        assert "version" in data
        assert "uptime_seconds" in data

    async def test_health_degraded_when_db_down(self, client):
        with patch("app.db.postgres.SessionLocal") as mock_sl, \
             patch("app.vectorstore.opensearch_client.opensearch_client") as mock_os:
            mock_os.ping = AsyncMock(return_value=False)
            mock_sl.return_value.__aenter__ = AsyncMock(side_effect=Exception("DB down"))
            res = await client.get("/api/v1/health")
        # 200 döner ama status degraded olabilir
        assert res.status_code == 200


class TestDocuments:
    async def test_list_documents_requires_auth(self, client):
        res = await client.get("/api/v1/documents")
        assert res.status_code == 401

    async def test_list_documents_authenticated(self, client, auth_headers):
        res = await client.get("/api/v1/documents", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "documents" in data


class TestDrafts:
    async def test_create_draft(self, client, auth_headers):
        res = await client.post("/api/v1/drafts/", json={"title": "Test Taslak"}, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["title"] == "Test Taslak"

    async def test_delete_others_draft_forbidden(self, client, auth_headers, admin_headers, db_session):
        """Başka kullanıcının draft'ını silemez."""
        # Admin kendi draft'ını oluşturur
        create_res = await client.post("/api/v1/drafts/", json={"title": "Admin Taslak"}, headers=admin_headers)
        draft_id = create_res.json()["id"]
        # Normal user silmeye çalışır
        del_res = await client.delete(f"/api/v1/drafts/{draft_id}", headers=auth_headers)
        assert del_res.status_code == 403


class TestAdmin:
    async def test_admin_users_requires_admin(self, client, auth_headers):
        """Normal kullanıcı admin endpoint'e erişemez."""
        res = await client.get("/api/v1/admin/users", headers=auth_headers)
        assert res.status_code == 403

    async def test_admin_users_accessible_by_admin(self, client, admin_headers):
        res = await client.get("/api/v1/admin/users", headers=admin_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)
