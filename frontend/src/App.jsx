import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  // 1. 状態（State）を定義する
  const [inputText, setInputText] = useState(''); // 入力フォームのテキスト
  const [result, setResult] = useState(null);       // APIからの結果
  const [isLoading, setIsLoading] = useState(false);  // ローディング中かどうか
  const [error, setError] = useState(null);         // エラーメッセージ

  // 2. フォームが送信されたときの処理
  const handleSubmit = async (e) => {
    e.preventDefault(); // フォーム送信時のページリロードを防ぐ
    setIsLoading(true); //ローディング開始
    setError(null);
    setResult(null);

    try {
      // 3. FastAPIにリクエストを送信
      const response = await fetch('http://127.0.0.1:8000/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }), // 入力テキストをJSON形式で送信
      });

      if (!response.ok) {
        throw new Error('サーバーからの応答がありません');
      }

      const data = await response.json();
      setResult(data); // 結果をStateに保存

    } catch (err) {
      setError(err.message); // エラーをStateに保存
    } finally {
      setIsLoading(false); // ローディング終了
    }
  };

  // 4. 画面の見た目（JSX）
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
            style={{ width: '300px', padding: '10px' }}
          />
          <button type="submit" disabled={isLoading} style={{ padding: '10px', marginLeft: '10px' }}>
            {isLoading ? '処理中...' : '記録する'}
          </button>
        </form>

        {/* 結果表示エリア */}
        <div style={{ marginTop: '20px' }}>
          {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
          {result && (
            <div>
              <h2>解析結果</h2>
              <p>品目: {result.item}</p>
              <p>金額: {result.price} 円</p>
              <p>カテゴリ: {result.category}</p>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App
