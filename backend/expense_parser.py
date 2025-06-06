import re
from .classification_rules import KEYWORD_RULES # ステップ1で作成した辞書をインポート

def parse_and_classify(text: str) -> dict:
    """
    ユーザーの入力文から品目、金額、カテゴリを抽出する。
    """
    
    # 1. 正規表現を使って、金額（半角・全角数字）を抜き出す
    # 例: "300円", "300 円", "300" -> 300
    price_match = re.search(r'([0-9０-９,，]+)\s*円?', text)
    
    if price_match:
        # 全角数字やカンマを半角数字に変換・除去
        price_str = price_match.group(1).translate(str.maketrans({chr(0xFF01 + i): chr(0x21 + i) for i in range(94)})).replace(",", "")
        price = int(price_str)
        # 金額部分をテキストから削除して、品目名とする
        item = text.replace(price_match.group(0), "").strip()
    else:
        # 金額が見つからない場合
        price = 0
        item = text.strip()

    # 2. キーワード辞書を使ってカテゴリを判定する
    assigned_category = "その他" # デフォルトのカテゴリ
    for category, keywords in KEYWORD_RULES.items():
        for keyword in keywords:
            if keyword in item:
                assigned_category = category
                break # カテゴリが見つかったら、そのカテゴリのチェックを終了
        if assigned_category != "その他":
            break # 外部のループも終了

    # 3. 解析結果を辞書として返す
    return {
        "item": item,
        "price": price,
        "category": assigned_category
    }

# --- 関数の動作テスト ---
# print(parse_and_classify("近所のスーパーで買い物 2,500円"))
# -> {'item': '近所のスーパーで買い物', 'price': 2500, 'category': '食費'}

# print(parse_and_classify("参考書を買った 3000"))
# -> {'item': '参考書を買った', 'price': 3000, 'category': '自己投資'}

# print(parse_and_classify("友達へのプレゼント")) # 金額なしのケース
# -> {'item': '友達へのプレゼント', 'price': 0, 'category': '交際費'}