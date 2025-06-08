import re

def parse_income(text: str) -> dict:
    """
    収入の入力文から収入源と金額を抽出する。
    """
    price_match = re.search(r'([0-9０-９,，]+)\s*円?', text)
    
    if price_match:
        price_str = price_match.group(1).translate(str.maketrans({chr(0xFF01 + i): chr(0x21 + i) for i in range(94)})).replace(",", "")
        amount = int(price_str)
        source = text.replace(price_match.group(0), "").strip()
    else:
        amount = 0
        source = text.strip()

    return {"source": source, "amount": amount}