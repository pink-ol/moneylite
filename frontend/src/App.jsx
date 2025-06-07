import { useState, useEffect } from 'react'; // useEffect をインポート
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  // 単一の結果ではなく、出費のリストを管理する
  const [expenses, setExpenses] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 初回レンダリング時に出費一覧を取得する
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/expenses');
        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }
        const data = await response.json();
        setExpenses(data); // 取得したデータでリストを更新
      } catch (err) {
        setError(err.message);
      }
    };
    fetchExpenses();
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
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>MyMoneyLite</h1>
        <form onSubmit={handleSubmit}>
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
                <th style={{ border: '1px solid white', padding: '8px' }}>日時</th>
                <th style={{ border: '1px solid white', padding: '8px' }}>品目</th>
                <th style={{ border: '1px solid white', padding: '8px' }}>カテゴリ</th>
                <th style={{ border: '1px solid white', padding: '8px' }}>金額</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td style={{ border: '1px solid white', padding: '8px' }}>
                    {new Date(expense.created_at).toLocaleString('ja-JP')}
                  </td>
                  <td style={{ border: '1px solid white', padding: '8px' }}>{expense.item}</td>
                  <td style={{ border: '1px solid white', padding: '8px' }}>{expense.category}</td>
                  <td style={{ border: '1px solid white', padding: '8px', textAlign: 'right' }}>
                    {expense.price.toLocaleString()} 円
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