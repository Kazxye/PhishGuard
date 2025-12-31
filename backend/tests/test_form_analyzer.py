import pytest

from app.services.form_analyzer import analyze_forms, find_suspicious_patterns


class TestFormAnalyzer:
    def test_empty_html_returns_zero_score(self):
        result = analyze_forms("", "example.com")
        
        assert result.score == 0
        assert result.total_forms == 0

    def test_detects_password_fields(self, sample_html_with_form):
        result = analyze_forms(sample_html_with_form, "example.com")
        
        assert result.password_fields >= 1

    def test_detects_external_form_action(self, sample_html_with_form):
        result = analyze_forms(sample_html_with_form, "example.com")
        
        assert len(result.external_actions) > 0
        assert "evil-site.com" in result.external_actions

    def test_detects_credit_card_input(self, sample_html_with_form):
        result = analyze_forms(sample_html_with_form, "example.com")
        
        credit_patterns = [p for p in result.suspicious_patterns if "credit" in p]
        assert len(credit_patterns) > 0

    def test_clean_page_low_score(self, sample_clean_html):
        result = analyze_forms(sample_clean_html, "example.com")
        
        assert result.score == 0
        assert result.total_forms == 0
        assert result.password_fields == 0

    def test_hidden_fields_counted(self, sample_html_with_form):
        result = analyze_forms(sample_html_with_form, "example.com")
        
        assert result.hidden_fields >= 1


class TestSuspiciousPatterns:
    def test_detects_verify_text(self):
        from bs4 import BeautifulSoup
        
        html = "<html><body><p>Please verify your account</p></body></html>"
        soup = BeautifulSoup(html, "lxml")
        
        patterns = find_suspicious_patterns(soup)
        
        assert any("verify" in p for p in patterns)

    def test_detects_suspended_text(self):
        from bs4 import BeautifulSoup
        
        html = "<html><body><p>Your account has been suspended</p></body></html>"
        soup = BeautifulSoup(html, "lxml")
        
        patterns = find_suspicious_patterns(soup)
        
        assert any("suspend" in p for p in patterns)
