"""
Auth Route Testleri
"""
import pytest


class TestRegister:
    async def test_register_success(self, client):
        res = await client.post("/api/v1/auth/register", json={
            "name": "Yeni Kullanıcı",
            "email": "yeni@test.com",
            "password": "test1234",
        })
        assert res.status_code == 201
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_duplicate_email(self, client, test_user):
        res = await client.post("/api/v1/auth/register", json={
            "name": "Kopya",
            "email": test_user.email,
            "password": "test1234",
        })
        assert res.status_code == 400

    async def test_register_weak_password(self, client):
        res = await client.post("/api/v1/auth/register", json={
            "name": "Kullanıcı",
            "email": "weak@test.com",
            "password": "kısa",  # 8 karakter altı
        })
        assert res.status_code == 422

    async def test_register_password_no_digit(self, client):
        res = await client.post("/api/v1/auth/register", json={
            "name": "Kullanıcı",
            "email": "nodigit@test.com",
            "password": "rakamsizşifre",
        })
        assert res.status_code == 422


class TestLogin:
    async def test_login_success(self, client, test_user):
        res = await client.post("/api/v1/auth/login", json={
            "email": test_user.email,
            "password": "testpass123",
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        # httpOnly cookie set edilmeli
        assert "lexai_token" in res.cookies

    async def test_login_wrong_password(self, client, test_user):
        res = await client.post("/api/v1/auth/login", json={
            "email": test_user.email,
            "password": "yanlis_sifre",
        })
        assert res.status_code == 401

    async def test_login_nonexistent_user(self, client):
        res = await client.post("/api/v1/auth/login", json={
            "email": "yok@test.com",
            "password": "herhangibir123",
        })
        assert res.status_code == 401


class TestMe:
    async def test_get_me_authenticated(self, client, test_user, auth_headers):
        res = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == test_user.email
        assert data["role"] == "user"

    async def test_get_me_unauthenticated(self, client):
        res = await client.get("/api/v1/auth/me")
        assert res.status_code == 401


class TestLogout:
    async def test_logout_clears_cookies(self, client, test_user):
        # Login first
        await client.post("/api/v1/auth/login", json={
            "email": test_user.email,
            "password": "testpass123",
        })
        # Then logout
        res = await client.post("/api/v1/auth/logout")
        assert res.status_code == 200
        assert res.json()["message"] == "Çıkış yapıldı"


class TestForgotPassword:
    async def test_forgot_password_always_202(self, client):
        """Timing attack'ı önlemek için her zaman 202 döner."""
        res = await client.post("/api/v1/auth/forgot-password", json={
            "email": "yok@test.com",
        })
        assert res.status_code == 202

    async def test_forgot_password_registered_user(self, client, test_user):
        res = await client.post("/api/v1/auth/forgot-password", json={
            "email": test_user.email,
        })
        assert res.status_code == 202
