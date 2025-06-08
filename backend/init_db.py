import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "moneylite.db"

# データベースに接続（ファイルがなければ新規作成）
conn = sqlite3.connect(DB_PATH)
print("データベースに接続しました．")

# SQLを実行するためのカーソルオブジェクトを作成
cursor = conn.cursor()

# expenseテーブルを作成するSQL分
# IF NOT EXISTS をつけると，既にテーブルが存在していてもエラーにならない
cursor.execute('''
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item TEXT NOT NULL,
    price INTEGER NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')
print("テーブルを作成しました（または既に存在します）．")

cursor.execute('''
CREATE TABLE IF NOT EXISTS settings(
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
)
''')
print("settingsテーブルを作成しました．")

# 初期残高の初期値を挿入（存在しない場合のみ）
cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ('initial_balance', '0'))
print("初期残高のデフォルト値を設定しました．")

# 変更をコミット（確定）
conn.commit()

# 接続を閉じる
conn.close()
print("データベース接続を閉じました．")