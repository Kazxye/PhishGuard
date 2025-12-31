import pytest

from app.services.homograph_detector import analyze_homographs, detect_character_script


class TestHomographDetector:
    def test_clean_domain_has_no_homographs(self):
        result = analyze_homographs("google.com")
        
        assert result.has_homographs is False
        assert len(result.suspicious_characters) == 0
        assert result.score == 0

    def test_detects_cyrillic_a(self):
        result = analyze_homographs("аpple.com")  # Cyrillic 'а'
        
        assert result.has_homographs is True
        assert len(result.suspicious_characters) == 1
        assert result.suspicious_characters[0]["looks_like"] == "a"
        assert result.suspicious_characters[0]["script"] == "Cyrillic"
        assert result.score > 0

    def test_detects_multiple_homographs(self):
        result = analyze_homographs("раураl.com")  # Multiple Cyrillic chars
        
        assert result.has_homographs is True
        assert len(result.suspicious_characters) >= 2
        assert result.score >= 30

    def test_generates_punycode(self):
        result = analyze_homographs("аpple.com")
        
        assert result.punycode_domain is not None
        assert result.punycode_domain.startswith("xn--")

    def test_detects_greek_characters(self):
        result = analyze_homographs("αpple.com")  # Greek alpha
        
        assert result.has_homographs is True
        assert any(c["script"] == "Greek" for c in result.suspicious_characters)


class TestScriptDetection:
    def test_detects_latin(self):
        assert detect_character_script("a") == "latin"
        assert detect_character_script("z") == "latin"

    def test_detects_cyrillic(self):
        assert detect_character_script("а") == "cyrillic"  # Cyrillic а
        assert detect_character_script("р") == "cyrillic"  # Cyrillic р

    def test_detects_greek(self):
        assert detect_character_script("α") == "greek"
        assert detect_character_script("ω") == "greek"
