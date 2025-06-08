import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- State定義 ---
  // データ関連
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [summaryData, setSummaryData] = useState({
    balance_at_payday: 0,
    adhoc_incomes: 0,
    salary_incomes: 0,
    cycle_expenses: 0,
    current_balance: 0,
    projected_next_balance: 0,
  });

  // フォーム入力値関連
  const [expenseInputText, setExpenseInputText] = useState('');
  const [incomeInputText, setIncomeInputText] = useState('');
  const [balanceInput, setBalanceInput] = useState("");
  
  // UIの状態関連
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- データ取得 ---
  const fetchData = async () => {
    setError(null);
    try {
      // 3つのAPI（支出履歴、収入履歴、サマリー）を同時に呼び出す
      const [expensesRes, incomesRes, summaryRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/expenses'),
        fetch('http://127.0.0.1:8000/incomes'),
        fetch('http://127.0.0.1:8000/summary')
      ]);

      if (!expensesRes.ok || !incomesRes.ok || !summaryRes.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const expensesData = await expensesRes.json();
      const incomesData = await incomesRes.json();
      const summaryData = await summaryRes.json();

      // 取得したデータでStateを更新
      setExpenses(expensesData);
      setIncomes(incomesData);
      setSummaryData(summaryData);
      setBalanceInput(summaryData.balance_at_payday.toString());

    } catch (err) {
      setError(err.message);
    }
  };

  // 画面の初回表示時に一度だけデータを取得する
  useEffect(() => {
    fetchData();
  }, []);

  // --- イベントハンドラ（ユーザー操作に対応する関数群） ---

  // 「給料日時点の残高」を設定
  const handleSetBalance = async (e) => {
    e.preventDefault();
    const newBalance = parseInt(balanceInput, 10);
    if (isNaN(newBalance) || newBalance < 0) {
      setError("初期残高には0以上の有効な数値を入力してください。");
      return;
    }
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: newBalance }),
      });
      if (!response.ok) {
        throw new Error('初期残高の設定に失敗しました');
      }
      await fetchData(); // 成功したら全データを再取得して画面を更新
    } catch (err) {
      setError(err.message);
    }
  };

  // 支出を記録
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseInputText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: expenseInputText }),
      });
      if (!response.ok) {
        throw new Error('支出の記録に失敗しました');
      }
      await fetchData();
      setExpenseInputText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 支出を削除
  const handleExpenseDelete = async (id) => {
    if (!window.confirm("この支出項目を本当に削除しますか？")) return;
    setError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/expenses/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('支出の削除に失敗しました');
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // 収入を記録
  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!incomeInputText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: incomeInputText }),
      });
      if (!response.ok) throw new Error('収入の記録に失敗しました');
      await fetchData();
      setIncomeInputText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 収入を削除
  const handleIncomeDelete = async (id) => {
    if (!window.confirm("この収入項目を本当に削除しますか？")) return;
    setError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/incomes/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('収入の削除に失敗しました');
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- 画面表示(JSX) ---
  return (
    <div className="App">
      <header className="App-header">
        <h1>MyMoneyLite</h1>

        {/* サマリー表示 */}
        <div style={{ background: '#333', padding: '20px', borderRadius: '10px', marginBottom: '10px', width: '90%', maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', borderBottom: '1px solid #555', paddingBottom: '15px' }}>
            <div style={{ margin: '10px' }}><p style={{ margin: 0, color: '#aaa' }}>前回の給料日時点の残高</p><p style={{ margin: 0, fontSize: '20px' }}>¥{summaryData.balance_at_payday?.toLocaleString()}</p></div>
            <div style={{ margin: '10px' }}><p style={{ margin: 0, color: '#aaa' }}>今サイクルの臨時収入</p><p style={{ margin: 0, fontSize: '20px', color: '#66ff99' }}>¥{summaryData.adhoc_incomes?.toLocaleString()}</p></div>
            <div style={{ margin: '10px' }}><p style={{ margin: 0, color: '#aaa' }}>今サイクルの支出</p><p style={{ margin: 0, fontSize: '20px', color: '#ff6666' }}>¥{summaryData.cycle_expenses?.toLocaleString()}</p></div>
            <div style={{ margin: '10px' }}><p style={{ margin: 0, color: '#aaa' }}>次期繰越の給与収入</p><p style={{ margin: 0, fontSize: '20px', color: '#66ff99' }}>¥{summaryData.salary_incomes?.toLocaleString()}</p></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', paddingTop: '15px' }}>
            <div style={{ margin: '10px' }}><p style={{ margin: 0, color: '#aaa', fontSize: '18px' }}>現在残高（今使えるお金）</p><p style={{ margin: 0, fontSize: '32px', color: '#66ccff', fontWeight: 'bold' }}>¥{summaryData.current_balance?.toLocaleString()}</p></div>
            <div style={{ margin: '10px' }}><p style={{ margin: 0, color: '#aaa', fontSize: '18px' }}>次の給料日時点の予測残高</p><p style={{ margin: 0, fontSize: '32px', color: 'orange', fontWeight: 'bold' }}>¥{summaryData.projected_next_balance?.toLocaleString()}</p></div>
          </div>
        </div>

        {/* 残高設定フォーム */}
        <form onSubmit={handleSetBalance} style={{ margin: '10px 0' }}>
          <input type="number" value={balanceInput} onChange={(e) => setBalanceInput(e.target.value)} style={{ width: '250px', padding: '10px', fontSize: '16px' }} placeholder="給料日時点の残高を入力" />
          <button type="submit" style={{ padding: '10px', marginLeft: '10px', fontSize: '16px' }}>設定</button>
        </form>
        
        {error && <p style={{ color: 'red', marginTop: '20px' }}>エラー: {error}</p>}
        <hr style={{ width: '90%', borderColor: '#444', margin: '30px 0' }} />

        {/* 支出と収入の入力・履歴エリア */}
        <div style={{ display: 'flex', width: '95%', justifyContent: 'space-around', flexWrap: 'wrap' }}>
          {/* 支出セクション */}
          <div style={{ width: '48%', minWidth: '400px', marginBottom: '20px' }}>
            <h2>支出</h2>
            <form onSubmit={handleExpenseSubmit}>
              <input type="text" value={expenseInputText} onChange={(e) => setExpenseInputText(e.target.value)} placeholder="例：ラーメン 800円" style={{ width: '250px', padding: '8px' }} />
              <button type="submit" disabled={isLoading} style={{ padding: '8px', marginLeft: '10px' }}>{isLoading ? '...' : '支出を記録'}</button>
            </form>
            <h3 style={{ marginTop: '20px' }}>支出履歴</h3>
            <table style={{ width: '100%' }}>
              <thead><tr><th>日時</th><th>品目</th><th>カテゴリ</th><th>金額</th><th>操作</th></tr></thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.created_at).toLocaleString('ja-JP')}</td>
                    <td>{expense.item}</td><td>{expense.category}</td>
                    <td style={{ textAlign: 'right' }}>{expense.price.toLocaleString()} 円</td>
                    <td><button onClick={() => handleExpenseDelete(expense.id)}>削除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 収入セクション */}
          <div style={{ width: '48%', minWidth: '400px' }}>
            <h2>収入</h2>
            <form onSubmit={handleIncomeSubmit}>
              <input type="text" value={incomeInputText} onChange={(e) => setIncomeInputText(e.target.value)} placeholder="例：バイト代 給料 50000円" style={{ width: '250px', padding: '8px' }}/>
              <button type="submit" disabled={isLoading} style={{ padding: '8px', marginLeft: '10px' }}>{isLoading ? '...' : '収入を記録'}</button>
            </form>
            <h3 style={{ marginTop: '20px' }}>収入履歴</h3>
            <table style={{ width: '100%' }}>
              <thead><tr><th>日時</th><th>収入源</th><th>金額</th><th>操作</th></tr></thead>
              <tbody>
                {incomes.map((income) => (
                  <tr key={income.id}>
                    <td>{new Date(income.created_at).toLocaleString('ja-JP')}</td>
                    <td>{income.source}</td>
                    <td style={{ textAlign: 'right' }}>{income.amount.toLocaleString()} 円</td>
                    <td><button onClick={() => handleIncomeDelete(income.id)}>削除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;