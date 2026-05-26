import { useState } from 'react';
import './index.css';

// ダッシュボード画面コンポーネント
const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-title">
          <span>🌦️</span> AI需要予測
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          明日は雨（降水確率80%）のため、客数が15%減少する見込みです。生鮮食品の発注を抑えることをお勧めします。
        </p>
      </div>

      <div className="card">
        <div className="card-title">
          <span>⚠️</span> アラート：消費期限間近
        </div>
        <div className="list-item">
          <div className="item-info">
            <h3>鶏もも肉</h3>
            <p>残り: 2kg</p>
          </div>
          <span className="badge badge-danger">明日まで</span>
        </div>
        <div className="list-item" style={{ borderBottom: 'none' }}>
          <div className="item-info">
            <h3>トマト</h3>
            <p>残り: 15個</p>
          </div>
          <span className="badge badge-warning">あと2日</span>
        </div>
        <button className="btn btn-outline" style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.875rem' }}>
          💡 余り食材で「裏メニュー」を提案
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>本日の発注リスト</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI推奨値</span>
      </div>
      
      <div className="card" style={{ padding: '0' }}>
        <div className="list-item" style={{ padding: '1rem', flexWrap: 'wrap' }}>
          <div className="item-info" style={{ width: '100%', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem' }}>キャベツ (玉)</h3>
              <span className="badge badge-warning" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>先週同曜日の消費: 5玉</span>
            </div>
            <p style={{ marginTop: '0.25rem' }}>現在の在庫: 1玉 (基準: 5玉)</p>
          </div>
          <div className="item-action" style={{ width: '100%', justifyContent: 'flex-end', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', marginRight: 'auto', fontWeight: '500' }}>発注量:</span>
            <button className="qty-btn">-</button>
            <span className="qty-display" style={{ color: 'var(--primary-color)' }}>4</span>
            <button className="qty-btn">+</button>
          </div>
        </div>
        
        <div className="list-item" style={{ padding: '1rem', flexWrap: 'wrap' }}>
          <div className="item-info" style={{ width: '100%', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem' }}>ビール（樽）</h3>
              <span className="badge badge-warning" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>先週同曜日の消費: 4樽</span>
            </div>
            <p style={{ marginTop: '0.25rem' }}>現在の在庫: 1樽 (基準: 3樽)</p>
          </div>
          <div className="item-action" style={{ width: '100%', justifyContent: 'flex-end', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', marginRight: 'auto', fontWeight: '500' }}>発注量:</span>
            <button className="qty-btn">-</button>
            <span className="qty-display" style={{ color: 'var(--primary-color)' }}>2</span>
            <button className="qty-btn">+</button>
          </div>
        </div>
      </div>
      
      <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
        まとめて発注する
      </button>
    </div>
  );
};

// 在庫入力画面コンポーネント
const InventoryInput = () => {
  return (
    <div className="inventory-input">
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--primary-color)', color: 'white' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>🎤 音声でサクッと棚卸し</h2>
        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
          「キャベツ3玉、トマト5個」のように話しかけてください。手が濡れていても大丈夫です。
        </p>
        <button className="btn" style={{ backgroundColor: 'white', color: 'var(--primary-color)', marginTop: '1rem' }}>
          音声入力を開始
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>本日の在庫入力</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>野菜カテゴリ ▼</span>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <div className="list-item" style={{ padding: '1rem' }}>
          <div className="item-info">
            <h3>キャベツ (玉)</h3>
            <p>昨日: 3玉</p>
          </div>
          <div className="item-action">
            <button className="qty-btn">-</button>
            <span className="qty-display">1</span>
            <button className="qty-btn">+</button>
          </div>
        </div>
        <div className="list-item" style={{ padding: '1rem' }}>
          <div className="item-info">
            <h3>トマト (個)</h3>
            <p>昨日: 20個</p>
          </div>
          <div className="item-action">
            <button className="qty-btn">-</button>
            <span className="qty-display">15</span>
            <button className="qty-btn">+</button>
          </div>
        </div>
        <div className="list-item" style={{ padding: '1rem' }}>
          <div className="item-info">
            <h3>玉ねぎ (個)</h3>
            <p>昨日: 10個</p>
          </div>
          <div className="item-action">
            <button className="qty-btn">-</button>
            <span className="qty-display">8</span>
            <button className="qty-btn">+</button>
          </div>
        </div>
      </div>
      
      <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
        在庫を確定して発注へ
      </button>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      <header className="header">
        <h1>ロスゼロ・マイスター</h1>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
          🧑‍🍳
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'dashboard' ? <Dashboard /> : <InventoryInput />}
      </main>

      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="nav-icon">📊</span>
          ダッシュボード
        </button>
        <button 
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <span className="nav-icon">📦</span>
          在庫入力
        </button>
        <button className="nav-item">
          <span className="nav-icon">📋</span>
          商品マスタ
        </button>
        <button className="nav-item">
          <span className="nav-icon">⚙️</span>
          設定
        </button>
      </nav>
    </div>
  );
}

export default App;
