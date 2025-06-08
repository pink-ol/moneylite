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
