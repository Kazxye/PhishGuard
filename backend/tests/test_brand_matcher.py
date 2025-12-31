import pytest

from app.services.brand_matcher import (
    analyze_brand_similarity,
    extract_domain_name,
    calculate_similarity,
)


class TestBrandMatcher:
    def test_exact_match_is_not_suspicious(self):
        result = analyze_brand_similarity("google.com")
        
        assert result.is_suspicious is False
        assert result.score == 0

    def test_detects_typosquatting(self):
        result = analyze_brand_similarity("g00gle.com")  # zeros instead of o's
        
        assert result.highest_similarity > 0.7
        assert result.matched_brand == "google"

    def test_detects_similar_domain(self):
        result = analyze_brand_similarity("paypa1.com")  # 1 instead of l
        
        assert result.is_suspicious is True
        assert result.matched_brand == "paypal"
        assert result.score > 0

    def test_unrelated_domain_not_flagged(self):
        result = analyze_brand_similarity("mycoolwebsite.com")
        
        assert result.is_suspicious is False
        assert result.highest_similarity < 0.75

    def test_brazilian_bank_detection(self):
        result = analyze_brand_similarity("1tau.com.br")  # 1 instead of i
        
        assert result.highest_similarity > 0.7


class TestDomainExtraction:
    def test_extracts_sld_from_simple_domain(self):
        assert extract_domain_name("google.com") == "google"

    def test_handles_subdomain(self):
        assert extract_domain_name("mail.google.com") == "google"

    def test_handles_country_code_tld(self):
        assert extract_domain_name("google.com.br") == "google"

    def test_handles_co_domains(self):
        assert extract_domain_name("example.co.uk") == "example"


class TestSimilarityCalculation:
    def test_identical_strings(self):
        assert calculate_similarity("google", "google") == 1.0

    def test_completely_different(self):
        similarity = calculate_similarity("abc", "xyz")
        assert similarity < 0.5

    def test_one_char_difference(self):
        similarity = calculate_similarity("google", "googl")
        assert similarity > 0.8

    def test_number_substitution_boost(self):
        similarity = calculate_similarity("g00gle", "google")
        assert similarity > 0.8
