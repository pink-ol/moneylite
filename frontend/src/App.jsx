import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- State定義 ---
  // データ
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [summaryData, setSummaryData] = useState({
    initial_balance: 0,
    total_incomes: 0,
    total_expenses: 0,
    current_balance: 0,
  });

  // フォーム入力値
  const [expenseInputText, setExpenseInputText] = useState('');
  const [incomeInputText, setIncomeInputText] = useState('');
  const [balanceInput, setBalanceInput] = useState("");
  
  // UIの状態
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- データ取得 ---
  const fetchData = async () => {
    setError(null);
    try {
      // 3つのAPIを同時に呼び出す
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

      setExpenses(expensesData);
      setIncomes(incomesData);
      setSummaryData(summaryData);
      setBalanceInput(summaryData.initial_balance.toString()); // 設定フォームの値を更新

    } catch (err) {
      setError(err.message);
    }
  };

  // 画面の初回表示時に一度だけデータを取得
  useEffect(() => {
    fetchData();
  }, []);

  // --- イベントハンドラ ---

  // 初期残高を設定
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
      await fetchData(); // 成功したら全データを再取得
    } catch (err) {
      setError(err.message);
    }
  };

  // 支出を登録
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
      setExpenseInputText(''); // 入力フォームを空にする
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 支出を削除
  const handleExpenseDelete = async (id) => {
    if (!window.confirm("この支出項目を本当に削除しますか？")) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/expenses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('支出の削除に失敗しました');
      }
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // 収入を登録
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
      if (!response.ok) {
        throw new Error('収入の記録に失敗しました');
      }
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
    if (!window.confirm("この収入項目を本当に削除しますか？")) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/incomes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('収入の削除に失敗しました');
      }
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
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', width: '80%', maxWidth: '800px', background: '#333', padding: '20px', borderRadius: '10px', marginBottom: '10px' }}>
          <div style={{ margin: '10px' }}><p style={{ margin: 0, color: '#aaa' }}>初期残高</p><p style={{ margin: 0, fontSize: '24px' }}>¥{summaryData.initial_balance.toLocaleString()}</p></div>
          <div style={{ margin: '10px' }}><p style={{ margin: 0, color: '#aaa' }}>今月の収入</p><p style={{ margin: 0, fontSize: '24px', color: '#66ff99' }}>¥{summaryData.total_incomes.toLocaleString()}</p></div>
          <div style={{ margin: '10px' }}><p style={{ margin: 0, color: '#aaa' }}>今月の支出</p><p style={{ margin: 0, fontSize: '24px', color: '#ff6666' }}>¥{summaryData.total_expenses.toLocaleString()}</p></div>
          <div style={{ margin: '10px' }}><p style={{ margin: 0, color: '#aaa' }}>現在残高</p><p style={{ margin: 0, fontSize: '24px', color: '#66ccff' }}>¥{summaryData.current_balance.toLocaleString()}</p></div>
        </div>

        {/* 初期残高設定フォーム */}
        <form onSubmit={handleSetBalance} style={{ margin: '10px 0' }}>
          <input type="number" value={balanceInput} onChange={(e) => setBalanceInput(e.target.value)} style={{ width: '200px', padding: '10px', fontSize: '16px' }} />
          <button type="submit" style={{ padding: '10px', marginLeft: '10px', fontSize: '16px' }}>初期残高を設定</button>
        </form>

        {error && <p style={{ color: 'red', marginTop: '20px' }}>エラー: {error}</p>}
        <hr style={{ width: '90%', borderColor: '#444', margin: '30px 0' }} />

        {/* 収入と支出のセクション */}
        <div style={{ display: 'flex', width: '95%', justifyContent: 'space-around', flexWrap: 'wrap' }}>

          {/* 支出セクション */}
          <div style={{ width: '48%', minWidth: '400px', marginBottom: '20px' }}>
            <h2>支出</h2>
            <form onSubmit={handleExpenseSubmit}>
              <input type="text" value={expenseInputText} onChange={(e) => setExpenseInputText(e.target.value)} placeholder="例：ラーメン 800円" style={{ width: '250px', padding: '8px' }} />
              <button type="submit" disabled={isLoading} style={{ padding: '8px', marginLeft: '10px' }}>{isLoading ? '...' : '支出を記録'}</button>
            </form>
            <h3 style={{marginTop: '20px'}}>支出履歴</h3>
            <table style={{width: '100%'}}>
              <thead><tr><th>日時</th><th>品目</th><th>カテゴリ</th><th>金額</th><th>操作</th></tr></thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.created_at).toLocaleString('ja-JP')}</td>
                    <td>{expense.item}</td>
                    <td>{expense.category}</td>
                    <td>{expense.price.toLocaleString()} 円</td>
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
              <input type="text" value={incomeInputText} onChange={(e) => setIncomeInputText(e.target.value)} placeholder="例：バイト代 50000円" style={{ width: '250px', padding: '8px' }} />
              <button type="submit" disabled={isLoading} style={{ padding: '8px', marginLeft: '10px' }}>{isLoading ? '...' : '収入を記録'}</button>
            </form>
            <h3 style={{marginTop: '20px'}}>収入履歴</h3>
            <table style={{width: '100%'}}>
              <thead><tr><th>日時</th><th>収入源</th><th>金額</th><th>操作</th></tr></thead>
              <tbody>
                {incomes.map((income) => (
                  <tr key={income.id}>
                    <td>{new Date(income.created_at).toLocaleString('ja-JP')}</td>
                    <td>{income.source}</td>
                    <td>{income.amount.toLocaleString()} 円</td>
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