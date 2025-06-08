from fastapi import FastAPI
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from .expense_parser import parse_and_classify # ステップ2で作成した関数をインポート
from . import crud
from .income_parser import parse_income

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
    balance_at_payday = int(crud.get_setting('initial_balance') or '0')
    cycle_expenses = crud.get_cycle_expenses()
    adhoc_incomes = crud.get_cycle_incomes(is_salary=False)
    salary_incomes = crud.get_cycle_incomes(is_salary=True)
    
    # 定額支出の合計を取得
    total_fixed_expenses = crud.get_total_fixed_expenses()
    
    # 残高計算式を更新（定額支出を差し引く）
    current_balance = balance_at_payday + adhoc_incomes - cycle_expenses - total_fixed_expenses
    projected_next_balance = current_balance + salary_incomes
    
    return {
        "balance_at_payday": balance_at_payday,
        "adhoc_incomes": adhoc_incomes,
        "salary_incomes": salary_incomes,
        "cycle_expenses": cycle_expenses,
        "total_fixed_expenses": total_fixed_expenses, # 定額支出合計を追加
        "current_balance": current_balance,
        "projected_next_balance": projected_next_balance,
    }

class BalanceUpdate(BaseModel):
    balance: int = Field(..., ge=0) # 0以上の整数

@app.post("/balance", response_model=dict)
async def update_balance(balance_update: BalanceUpdate):
    """初期残高を更新する"""
    crud.update_setting('initial_balance', str(balance_update.balance))
    return {"ok": True, "new_balance": balance_update.balance}

class IncomeInput(BaseModel):
    text: str

@app.post("/incomes", response_model=dict)
async def create_income_entry(income_input: IncomeInput):
    parsed_data = parse_income(income_input.text)
    new_income = crud.create_income(
        source=parsed_data["source"],
        amount=parsed_data["amount"]
    )
    return new_income

@app.get("/incomes", response_model=list[dict])
async def read_incomes():
    return crud.get_incomes()

@app.delete("/incomes/{income_id}", response_model=dict)
async def remove_income(income_id: int):
    success = crud.delete_income(income_id)
    return {"ok": success}

class FixedExpenseInput(BaseModel):
    name: str
    amount: int

@app.post("/fixed_expenses", response_model=dict)
async def create_fixed_expense_entry(item: FixedExpenseInput):
    new_item = crud.create_fixed_expense(name=item.name, amount=item.amount)
    return new_item

@app.get("/fixed_expenses", response_model=list[dict])
async def read_fixed_expenses():
    return crud.get_fixed_expenses()

@app.delete("/fixed_expenses/{item_id}", response_model=dict)
async def remove_fixed_expense(item_id: int):
    success = crud.delete_fixed_expense(item_id)
    return {"ok": success}