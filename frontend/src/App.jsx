import { useState, useEffect } from 'react'; // useEffect をインポート
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  // 単一の結果ではなく、出費のリストを管理する
  const [expenses, setExpenses] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState({
    initial_balance: 0,
    total_expenses: 0,
    current_balance: 0,
  });
  const [balanceInput, setBalanceInput] = useState("");
  // データを取得する関数を定義
  const fetchData = async () => {
    setError(null);
    try {
      // 履歴とサマリーを同時に取得
      const [expensesRes, summaryRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/expenses'),
        fetch('http://127.0.0.1:8000/summary')
      ]);
      if (!expensesRes.ok || !summaryRes.ok) {
        throw new Error('データの取得に失敗しました');
      }
      const expensesData = await expensesRes.json();
      const summaryData = await summaryRes.json();
      setExpenses(expensesData);
      setSummaryData(summaryData);
      setBalanceInput(summaryData.initial_balance.toString());
    } catch (err) {
      setError(err.message);
    }
  };
  // 初回レンダリング時に出費一覧を取得する
  useEffect(() => {
    fetchData();
  }, []); // 第2引数の空配列は「初回の一度だけ実行」を意味する

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('サーバーからの応答がありません');
      }

      const newExpense = await response.json();
      // 既存のリストの先頭に新しい出費を追加して、画面を更新
      setExpenses([newExpense, ...expenses]);
      setInputText(''); // 入力フォームを空にする

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
    await fetchData();
  };

  // 削除ボタンが押された時の処理
  const handleDelete = async (idToDelete) => {
    // ユーザーに確認を求める
    if (!window.confirm("この項目を本当に削除しますか？")) {
      return; // キャンセルされたら何もしない
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/expenses/${idToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }
      
      // 成功したら、画面上のリストからも削除する
      // IDが一致しないものだけを残す、というロジック
      setExpenses(expenses.filter(expense => expense.id !== idToDelete));

    } catch (err) {
      setError(err.message);
    }
    await fetchData();
  };

  // 初期残高を設定する関数を新規追加
  const handleSetBalance = async (e) => {
    e.preventDefault();
    const newBalance = parseInt(balanceInput, 10);
    if (isNaN(newBalance) || newBalance < 0){
      setError("有効な数値を入力してください．");
      return;
    }
    try{
      const response = await fetch('http://127.0.0.1:8000/balance',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({balance: newBalance}),
      });
      if (!response.ok) throw new Error('残高の設定に失敗しました');
      await fetchData(); //成功したらデータを再取得して画面を更新
    } catch (err){
      setError(err.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>MyMoneyLite</h1>
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '80%', maxWidth: '600px', background: '#333', padding: '20px', borderRadius: '10px' }}>
          <div>
            <p style={{ margin: 0, color: '#aaa' }}>初期残高</p>
            <p style={{ margin: 0, fontSize: '24px' }}>¥{summaryData.initial_balance.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#aaa' }}>今月の支出</p>
            <p style={{ margin: 0, fontSize: '24px', color: '#ff6666' }}>¥{summaryData.total_expenses.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#aaa' }}>現在残高</p>
            <p style={{ margin: 0, fontSize: '24px', color: '#66ccff' }}>¥{summaryData.current_balance.toLocaleString()}</p>
          </div>
        </div>

        {/* ▼▼▼ 初期残高設定フォームを新規追加 ▼▼▼ */}
        <form onSubmit={handleSetBalance} style={{ margin: '20px 0' }}>
          <input
            type="number"
            value={balanceInput}
            onChange={(e) => setBalanceInput(e.target.value)}
            style={{ width: '200px', padding: '10px', fontSize: '16px' }}
          />
          <button type="submit" style={{ padding: '10px', marginLeft: '10px', fontSize: '16px' }}>
            初期残高を設定
          </button>
        </form>

        <hr style={{ width: '80%', borderColor: '#444' }} />
        <form onSubmit={handleSubmit} style={{marginTop: '20px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="例：コンビニでパン 300円"
            style={{ width: '300px', padding: '10px', fontSize: '16px' }}
          />
          <button type="submit" disabled={isLoading} style={{ padding: '10px', marginLeft: '10px', fontSize: '16px' }}>
            {isLoading ? '記録中...' : '記録する'}
          </button>
        </form>

        {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
        
        {/* 出費履歴の一覧表示エリア */}
        <div style={{ marginTop: '30px', width: '80%' }}>
          <h2>出費履歴</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #555', padding: '8px' }}>日時</th>
                <th style={{ border: '1px solid #555', padding: '8px' }}>品目</th>
                <th style={{ border: '1px solid #555', padding: '8px' }}>カテゴリ</th>
                <th style={{ border: '1px solid #555', padding: '8px' }}>金額</th>
                <th style={{ border: '1px solid #555', padding: '8px'}}>操作</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td style={{ border: '1px solid #555', padding: '8px' }}>
                    {new Date(expense.created_at).toLocaleString('ja-JP')}
                  </td>
                  <td style={{ border: '1px solid #555', padding: '8px', textAlign: 'left' }}>{expense.item}</td>
                  <td style={{ border: '1px solid #555', padding: '8px' }}>{expense.category}</td>
                  <td style={{ border: '1px solid #555', padding: '8px', textAlign: 'right' }}>
                    {expense.price.toLocaleString()} 円
                  </td>
                  <td style={{ border: '1px solid #555', padding: '8px', textAlign: 'center'}}>
                    <button onClick={() => handleDelete(expense.id)} style={{ color: 'white', background: '#dc3545', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </header>
    </div>
  );
}

export default App;