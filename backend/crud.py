import sqlite3
from pathlib import Path # pathlibをインポート

DATABASE_URL = Path(__file__).parent / "moneylite.db"

def create_expense(item: str, price: int, category: str) -> dict:
    """出費をデータベースに登録する"""
    conn = sqlite3.connect(DATABASE_URL)
    # 辞書形式で結果を受け取るための設定
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO expenses (item, price, category) VALUES (?, ?, ?)",
        (item, price, category)
    )
    new_id = cursor.lastrowid
    conn.commit()

    # 登録した最新のデータを取得して返す
    cursor.execute("SELECT * FROM expenses WHERE id = ?", (new_id,))
    new_expense = dict(cursor.fetchone())

    conn.close()
    return new_expense

def get_expenses() -> list[dict]:
    """すべての出費を新しい順に取得する"""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM expenses ORDER BY created_at DESC")
    expenses = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return expenses

def delete_expense(expense_id: int) -> bool:
    """指定されたIDの出費をデータベースから削除する"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # 指定されたIDの行を削除するSQL
    cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    
    # 変更が成功したか（1行以上が影響を受けたか）を判定
    success = conn.total_changes > 0
    
    conn.close()
    return success

def get_setting(key: str) -> str | None:
    """設定テーブルから値を取得する"""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row['value'] if row else None

def update_setting(key: str, value: str):
    """設定テーブルの値を更新（または新規作成）する"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    # INSERT OR REPLACE は、キーが存在すればUPDATE、なければINSERTを実行する便利な命令
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()

def create_income(source: str, amount: int) -> dict:
    """収入をデータベースに登録する"""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("INSERT INTO incomes (source, amount) VALUES (?, ?)", (source, amount))
    new_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM incomes WHERE id = ?", (new_id,))
    new_income = dict(cursor.fetchone())
    conn.close()
    return new_income

def get_incomes() -> list[dict]:
    """すべての収入を新しい順に取得する"""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incomes ORDER BY created_at DESC")
    incomes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return incomes

def delete_income(income_id: int) -> bool:
    """指定されたIDの収入をデータベースから削除する"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM incomes WHERE id = ?", (income_id,))
    conn.commit()
    success = conn.total_changes > 0
    conn.close()
    return success

def get_cycle_expenses() -> int:
    """現在の財政サイクルの支出合計を取得する"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    # ... (前回のSQLクエリのロジックはほぼ同じ) ...
    query = """
    SELECT SUM(price) FROM expenses
    WHERE created_at >= (SELECT CASE WHEN STRFTIME('%d', 'now', 'localtime') >= '25' THEN DATE(STRFTIME('%Y-%m', 'now', 'localtime') || '-25') ELSE DATE(STRFTIME('%Y-%m', 'now', 'localtime', '-1 months') || '-25') END)
      AND created_at < (SELECT CASE WHEN STRFTIME('%d', 'now', 'localtime') >= '25' THEN DATE(STRFTIME('%Y-%m', 'now', 'localtime', '+1 months') || '-25') ELSE DATE(STRFTIME('%Y-%m', 'now', 'localtime') || '-25') END)
    """
    cursor.execute(query)
    total = cursor.fetchone()[0]
    conn.close()
    return total if total else 0

def get_cycle_incomes(is_salary: bool) -> int:
    """現在の財政サイクルの収入合計を、給料かそれ以外かで分けて取得する"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # is_salaryフラグによって、LIKE検索の条件を切り替える
    if is_salary:
        like_condition = "source LIKE '%給料%'"
    else:
        like_condition = "source NOT LIKE '%給料%'"

    query = f"""
    SELECT SUM(amount) FROM incomes
    WHERE ({like_condition})
      AND created_at >= (SELECT CASE WHEN STRFTIME('%d', 'now', 'localtime') >= '25' THEN DATE(STRFTIME('%Y-%m', 'now', 'localtime') || '-25') ELSE DATE(STRFTIME('%Y-%m', 'now', 'localtime', '-1 months') || '-25') END)
      AND created_at < (SELECT CASE WHEN STRFTIME('%d', 'now', 'localtime') >= '25' THEN DATE(STRFTIME('%Y-%m', 'now', 'localtime', '+1 months') || '-25') ELSE DATE(STRFTIME('%Y-%m', 'now', 'localtime') || '-25') END)
    """
    cursor.execute(query)
    total = cursor.fetchone()[0]
    conn.close()
    return total if total else 0

def create_fixed_expense(name: str, amount: int) -> dict:
    """定額支出をデータベースに登録する"""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("INSERT INTO fixed_expenses (name, amount) VALUES (?, ?)", (name, amount))
    new_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM fixed_expenses WHERE id = ?", (new_id,))
    new_item = dict(cursor.fetchone())
    conn.close()
    return new_item

def get_fixed_expenses() -> list[dict]:
    """すべての定額支出を取得する"""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fixed_expenses ORDER BY id DESC")
    items = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return items

def delete_fixed_expense(item_id: int) -> bool:
    """指定されたIDの定額支出を削除する"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM fixed_expenses WHERE id = ?", (item_id,))
    conn.commit()
    success = conn.total_changes > 0
    conn.close()
    return success

def get_total_fixed_expenses() -> int:
    """定額支出の合計金額を取得する"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(amount) FROM fixed_expenses")
    total = cursor.fetchone()[0]
    conn.close()
    return total if total else 0