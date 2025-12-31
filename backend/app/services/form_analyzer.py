from urllib.parse import urlparse

from bs4 import BeautifulSoup

from app.models.schemas import FormAnalysis


SUSPICIOUS_INPUT_PATTERNS = [
    "card", "credit", "cvv", "cvc", "expir", "ccnum",
    "ssn", "social", "routing", "account",
    "pin", "otp", "token", "code",
    "cpf", "cnpj", "rg",
]

SUSPICIOUS_FORM_PATTERNS = [
    "verify", "confirm", "secure", "update", "suspend",
    "locked", "unusual", "activity", "限制", "认证",
]


def analyze_forms(html_content: str, base_domain: str) -> FormAnalysis:
    if not html_content:
        return FormAnalysis(score=0)
    
    soup = BeautifulSoup(html_content, "lxml")
    
    forms = soup.find_all("form")
    total_forms = len(forms)
    
    password_fields = len(soup.find_all("input", {"type": "password"}))
    hidden_fields = len(soup.find_all("input", {"type": "hidden"}))
    
    external_actions = find_external_actions(forms, base_domain)
    suspicious_patterns = find_suspicious_patterns(soup)
    
    score = calculate_form_score(
        total_forms=total_forms,
        password_fields=password_fields,
        hidden_fields=hidden_fields,
        external_actions=external_actions,
        suspicious_patterns=suspicious_patterns,
    )
    
    return FormAnalysis(
        total_forms=total_forms,
        password_fields=password_fields,
        hidden_fields=hidden_fields,
        external_actions=external_actions,
        suspicious_patterns=suspicious_patterns,
        score=score,
    )


def find_external_actions(forms: list, base_domain: str) -> list[str]:
    external_actions = []
    
    for form in forms:
        action = form.get("action", "")
        
        if not action or action.startswith("/") or action.startswith("#"):
            continue
        
        try:
            parsed = urlparse(action)
            if parsed.netloc and parsed.netloc != base_domain:
                external_actions.append(parsed.netloc)
        except Exception:
            continue
    
    return list(set(external_actions))


def find_suspicious_patterns(soup: BeautifulSoup) -> list[str]:
    found_patterns = []
    
    page_text = soup.get_text().lower()
    
    for pattern in SUSPICIOUS_FORM_PATTERNS:
        if pattern in page_text:
            found_patterns.append(f"text:{pattern}")
    
    inputs = soup.find_all("input")
    for inp in inputs:
        input_name = (inp.get("name", "") + inp.get("id", "") + inp.get("placeholder", "")).lower()
        
        for pattern in SUSPICIOUS_INPUT_PATTERNS:
            if pattern in input_name:
                found_patterns.append(f"input:{pattern}")
                break
    
    return list(set(found_patterns))


def calculate_form_score(
    total_forms: int,
    password_fields: int,
    hidden_fields: int,
    external_actions: list[str],
    suspicious_patterns: list[str],
) -> int:
    score = 0
    
    if password_fields > 0:
        score += 15
    
    if password_fields > 2:
        score += 20
    
    if hidden_fields > 5:
        score += 15
    
    score += len(external_actions) * 25
    
    pattern_score = len([p for p in suspicious_patterns if p.startswith("input:")]) * 10
    pattern_score += len([p for p in suspicious_patterns if p.startswith("text:")]) * 5
    score += pattern_score
    
    return min(score, 100)
