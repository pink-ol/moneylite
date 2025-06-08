from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from .expense_parser import parse_and_classify # ステップ2で作成した関数をインポート
from . import crud
app = FastAPI()

origins = [
    "http://localhost:5173", # Reactアプリのアドレス
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # すべてのHTTPメソッドを許可
    allow_headers=["*"], # すべてのHTTPヘッダーを許可
)

class ExpenseInput(BaseModel):
    text: str # ユーザーが入力する自然文

class ExpenseOutput(BaseModel):
    item: str
    price: int
    category: str

@app.post("/expenses", response_model=dict)
async def create_expense(expense_input: ExpenseInput):
    """
    出費入力（自然文 → ルールベースで分類 → DB保存の前の処理）
    """
    # 入力されたテキストを解析・分類関数に渡す
    classified_data = parse_and_classify(expense_input.text)
    
    # ここで、classified_dataをデータベースに保存する処理を呼び出す（将来的に実装）
    # db.save(classified_data)
    new_expense = crud.create_expense(
        item = classified_data["item"],
        price = classified_data["price"],
        category = classified_data["category"]
    )
    
    # 解析結果をクライアント（フロントエンド）に返す
    return new_expense

# GET /expenses のエンドポイントを新規追加
@app.get("/expenses", response_model=list[dict])
async def read_expenses():
    return crud.get_expenses()

@app.delete("/expenses/{expense_id}", response_model=dict)
async def remove_expense(expense_id: int):
    """指定されたIDの出費を削除する"""
    success = crud.delete_expense(expense_id)
    return {"ok": success}
