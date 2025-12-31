KNOWN_BRANDS: dict[str, list[str]] = {
    "banking_br": [
        "itau",
        "bradesco",
        "santander",
        "bancodobrasil",
        "caixa",
        "nubank",
        "inter",
        "c6bank",
        "original",
        "safra",
        "btg",
        "xp",
    ],
    "banking_global": [
        "chase",
        "bankofamerica",
        "wellsfargo",
        "citibank",
        "hsbc",
        "barclays",
        "jpmorgan",
        "goldmansachs",
    ],
    "big_tech": [
        "google",
        "microsoft",
        "apple",
        "amazon",
        "meta",
        "facebook",
        "instagram",
        "whatsapp",
        "netflix",
        "spotify",
        "twitter",
        "linkedin",
        "github",
        "dropbox",
        "slack",
        "zoom",
        "adobe",
        "oracle",
        "salesforce",
    ],
    "ecommerce": [
        "mercadolivre",
        "americanas",
        "magazineluiza",
        "casasbahia",
        "aliexpress",
        "shopee",
        "shein",
        "ebay",
        "walmart",
        "target",
    ],
    "payment": [
        "paypal",
        "stripe",
        "pagseguro",
        "mercadopago",
        "picpay",
        "pix",
        "visa",
        "mastercard",
        "amex",
    ],
    "social": [
        "tiktok",
        "snapchat",
        "telegram",
        "discord",
        "reddit",
        "pinterest",
        "tumblr",
        "twitch",
        "youtube",
    ],
    "email": [
        "gmail",
        "outlook",
        "hotmail",
        "yahoo",
        "protonmail",
        "icloud",
    ],
    "government_br": [
        "gov",
        "receita",
        "inss",
        "detran",
        "poupatempo",
        "sefaz",
        "tse",
        "tst",
    ],
    "telecom_br": [
        "vivo",
        "claro",
        "tim",
        "oi",
        "nextel",
    ],
    "streaming": [
        "primevideo",
        "hbomax",
        "disneyplus",
        "paramount",
        "globoplay",
        "deezer",
    ],
}


def get_all_brands() -> list[str]:
    brands = []
    for category in KNOWN_BRANDS.values():
        brands.extend(category)
    return brands


def get_brands_by_category(category: str) -> list[str]:
    return KNOWN_BRANDS.get(category, [])


BRAND_LIST = get_all_brands()
