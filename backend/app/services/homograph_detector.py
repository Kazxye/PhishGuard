from app.models.schemas import HomographAnalysis

HOMOGRAPH_MAP: dict[str, str] = {
    "а": "a",  # Cyrillic
    "е": "e",  # Cyrillic
    "о": "o",  # Cyrillic
    "р": "p",  # Cyrillic
    "с": "c",  # Cyrillic
    "у": "y",  # Cyrillic
    "х": "x",  # Cyrillic
    "і": "i",  # Ukrainian
    "ј": "j",  # Serbian Cyrillic
    "ѕ": "s",  # Macedonian Cyrillic
    "ԁ": "d",  # Cyrillic
    "ԛ": "q",  # Cyrillic
    "ԝ": "w",  # Cyrillic
    "ɑ": "a",  # Latin alpha
    "ɡ": "g",  # Latin script g
    "ɩ": "i",  # Latin iota
    "ɴ": "n",  # Small capital N
    "ʀ": "r",  # Small capital R
    "ʙ": "b",  # Small capital B
    "ᴄ": "c",  # Small capital C
    "ᴅ": "d",  # Small capital D
    "ᴇ": "e",  # Small capital E
    "ᴍ": "m",  # Small capital M
    "ᴏ": "o",  # Small capital O
    "ᴘ": "p",  # Small capital P
    "ᴛ": "t",  # Small capital T
    "ᴜ": "u",  # Small capital U
    "ᴠ": "v",  # Small capital V
    "ᴡ": "w",  # Small capital W
    "α": "a",  # Greek alpha
    "β": "b",  # Greek beta
    "ε": "e",  # Greek epsilon
    "ι": "i",  # Greek iota
    "κ": "k",  # Greek kappa
    "ν": "n",  # Greek nu
    "ο": "o",  # Greek omicron
    "ρ": "p",  # Greek rho
    "τ": "t",  # Greek tau
    "υ": "u",  # Greek upsilon
    "χ": "x",  # Greek chi
    "ω": "w",  # Greek omega
    "０": "0",  # Fullwidth
    "１": "1",  # Fullwidth
    "２": "2",  # Fullwidth
    "ℓ": "l",  # Script small L
    "ℯ": "e",  # Script small e
    "ℴ": "o",  # Script small o
}

SCRIPT_NAMES: dict[str, str] = {
    "cyrillic": "Cyrillic",
    "greek": "Greek",
    "latin_ext": "Latin Extended",
    "fullwidth": "Fullwidth",
}


def detect_character_script(char: str) -> str:
    code_point = ord(char)
    
    if 0x0400 <= code_point <= 0x04FF:
        return "cyrillic"
    if 0x0370 <= code_point <= 0x03FF:
        return "greek"
    if 0xFF00 <= code_point <= 0xFFEF:
        return "fullwidth"
    if 0x1D00 <= code_point <= 0x1D7F:
        return "latin_ext"
    
    return "latin"


def analyze_homographs(domain: str) -> HomographAnalysis:
    suspicious_chars = []
    has_mixed_scripts = False
    scripts_found = set()
    
    normalized_domain = domain.lower()
    
    for idx, char in enumerate(normalized_domain):
        script = detect_character_script(char)
        scripts_found.add(script)
        
        if char in HOMOGRAPH_MAP:
            suspicious_chars.append({
                "position": idx,
                "character": char,
                "looks_like": HOMOGRAPH_MAP[char],
                "script": SCRIPT_NAMES.get(script, script),
                "unicode": f"U+{ord(char):04X}",
            })
    
    has_mixed_scripts = len(scripts_found) > 1 and "latin" in scripts_found
    has_homographs = len(suspicious_chars) > 0 or has_mixed_scripts
    
    punycode = None
    if has_homographs:
        try:
            punycode = domain.encode("idna").decode("ascii")
        except (UnicodeError, UnicodeDecodeError):
            punycode = None
    
    score = calculate_homograph_score(suspicious_chars, has_mixed_scripts)
    
    return HomographAnalysis(
        has_homographs=has_homographs,
        suspicious_characters=suspicious_chars,
        original_domain=domain,
        punycode_domain=punycode,
        score=score,
    )


def calculate_homograph_score(suspicious_chars: list[dict], has_mixed_scripts: bool) -> int:
    if not suspicious_chars and not has_mixed_scripts:
        return 0
    
    score = 0
    
    score += len(suspicious_chars) * 15
    
    if has_mixed_scripts:
        score += 25
    
    cyrillic_count = sum(1 for c in suspicious_chars if c["script"] == "Cyrillic")
    if cyrillic_count >= 2:
        score += 20
    
    return min(score, 100)
