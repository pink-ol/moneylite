from fastapi import FastAPI
from pydantic import BaseModel, Field
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

@app.get("/summary", response_model=dict)
async def get_summary():
    """残高サマリーを取得する"""
    initial_balance_str = crud.get_setting('initial_balance')
    initial_balance = int(initial_balance_str) if initial_balance_str else 0
    
    total_expenses = crud.get_current_month_total_expenses()
    
    current_balance = initial_balance - total_expenses
    
    return {
        "initial_balance": initial_balance,
        "total_expenses": total_expenses,
        "current_balance": current_balance
    }

class BalanceUpdate(BaseModel):
    balance: int = Field(..., ge=0) # 0以上の整数

@app.post("/balance", response_model=dict)
async def update_balance(balance_update: BalanceUpdate):
    """初期残高を更新する"""
    crud.update_setting('initial_balance', str(balance_update.balance))
    return {"ok": True, "new_balance": balance_update.balance}