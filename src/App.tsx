import { useState, useEffect } from 'react';
import './index.css';
import { useStore } from './store';

// ==========================================
// API Types & Helpers
// ==========================================
interface WeatherData {
  weathercode: number;
  precipitation_probability_max: number;
  temperature_2m_max: number;
}

// 天気コードからアイコンとテキストに変換
const getWeatherInfo = (code: number) => {
  if (code <= 3) return { icon: '☀️', text: '晴れ' };
  if (code <= 48) return { icon: '☁️', text: '曇り' };
  if (code <= 67) return { icon: '🌧️', text: '雨' };
  if (code <= 77) return { icon: '❄️', text: '雪' };
  return { icon: '🌧️', text: '雨' };
};


// ==========================================
// Dashboard Component
// ==========================================
const Dashboard = () => {
  const { products, currentInventory, orderQuantities, updateOrderQuantity, calculateRecommendedOrder } = useStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // 天気APIの取得（Open-Meteo: 東京都の明日）
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&daily=weathercode,temperature_2m_max,precipitation_probability_max&timezone=Asia%2FTokyo');
        const data = await res.json();
        // 明日のデータを取得 (index 1)
        setWeather({
          weathercode: data.daily.weathercode[1],
          precipitation_probability_max: data.daily.precipitation_probability_max[1],
          temperature_2m_max: data.daily.temperature_2m_max[1],
        });
      } catch (error) {
        console.error("Failed to fetch weather", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  // 消費期限が近い商品を抽出
  const expiringProducts = products.filter(p => p.expiresInDays !== undefined && p.expiresInDays <= 2);
  
  // 発注が必要な商品を抽出
  const needsOrdering = products.filter(p => {
    const recommended = calculateRecommendedOrder(p.id);
    const currentOrder = orderQuantities[p.id] !== undefined ? orderQuantities[p.id] : recommended;
    return recommended > 0 || currentOrder > 0;
  });

  return (
    <div className="dashboard">
      {/* AI需要予測 */}
      <div className="card">
        <div className="card-title">
          <span>🌦️</span> AI需要予測（明日の天気）
        </div>
        {loading ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>予測データを取得中...</p>
        ) : weather ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{getWeatherInfo(weather.weathercode).icon}</span>
              <span style={{ fontWeight: '600' }}>{getWeatherInfo(weather.weathercode).text}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>最高 {weather.temperature_2m_max}℃ / 降水確率 {weather.precipitation_probability_max}%</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {weather.precipitation_probability_max >= 50 
                ? '明日は雨の確率が高いため、客数が15%減少する見込みです。生鮮食品の発注を抑えることをお勧めします。'
                : '明日は天候が良いため、通常通りの客足が見込まれます。'}
            </p>
          </div>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>天気情報の取得に失敗しました</p>
        )}
      </div>

      {/* アラート */}
      <div className="card">
        <div className="card-title">
          <span>⚠️</span> アラート：消費期限間近
        </div>
        {expiringProducts.map((p, idx) => (
          <div key={p.id} className="list-item" style={{ borderBottom: idx === expiringProducts.length - 1 ? 'none' : undefined }}>
            <div className="item-info">
              <h3>{p.name}</h3>
              <p>残り: {currentInventory[p.id] || 0} {p.unit}</p>
            </div>
            <span className={`badge ${p.expiresInDays === 1 ? 'badge-danger' : 'badge-warning'}`}>
              {p.expiresInDays === 1 ? '明日まで' : `あと${p.expiresInDays}日`}
            </span>
          </div>
        ))}
        <button className="btn btn-outline" style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.875rem' }}>
          💡 余り食材で「裏メニュー」を提案
        </button>
      </div>

      {/* 発注リスト */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>本日の発注リスト</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI推奨値</span>
      </div>
      
      <div className="card" style={{ padding: '0' }}>
        {needsOrdering.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            発注が必要な商品はありません
          </div>
        ) : (
          needsOrdering.map(p => {
            const recommended = calculateRecommendedOrder(p.id);
            const displayQty = orderQuantities[p.id] !== undefined ? orderQuantities[p.id] : recommended;
            
            return (
              <div key={p.id} className="list-item" style={{ padding: '1rem', flexWrap: 'wrap' }}>
                <div className="item-info" style={{ width: '100%', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>{p.name} ({p.unit})</h3>
                    <span className="badge badge-warning" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>先週同曜日: {p.lastWeekConsumption}{p.unit}</span>
                  </div>
                  <p style={{ marginTop: '0.25rem' }}>現在の在庫: {currentInventory[p.id] || 0} (基準: {p.baseQuantity})</p>
                </div>
                <div className="item-action" style={{ width: '100%', justifyContent: 'flex-end', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', marginRight: 'auto', fontWeight: '500' }}>発注量:</span>
                  <button className="qty-btn" onClick={() => updateOrderQuantity(p.id, displayQty - 1)}>-</button>
                  <span className="qty-display" style={{ color: 'var(--primary-color)' }}>{displayQty}</span>
                  <button className="qty-btn" onClick={() => updateOrderQuantity(p.id, displayQty + 1)}>+</button>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
        まとめて発注する
      </button>
    </div>
  );
};

// ==========================================
// InventoryInput Component
// ==========================================
const InventoryInput = () => {
  const { products, currentInventory, updateInventory } = useStore();

  return (
    <div className="inventory-input">
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--primary-color)', color: 'white' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>🎤 音声でサクッと棚卸し</h2>
        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
          「キャベツ3玉、トマト5個」のように話しかけてください。
        </p>
        <button className="btn" style={{ backgroundColor: 'white', color: 'var(--primary-color)', marginTop: '1rem' }}>
          音声入力を開始
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>本日の在庫入力</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>全商品 ▼</span>
      </div>

      <div className="card" style={{ padding: '0' }}>
        {products.map(p => {
          const qty = currentInventory[p.id] || 0;
          return (
            <div key={p.id} className="list-item" style={{ padding: '1rem' }}>
              <div className="item-info">
                <h3>{p.name} ({p.unit})</h3>
                <p>昨日: {qty} {p.unit}</p> {/* 簡略化のため昨日の数値として現在の値を表示 */}
              </div>
              <div className="item-action">
                <button className="qty-btn" onClick={() => updateInventory(p.id, qty - 1)}>-</button>
                <span className="qty-display">{qty}</span>
                <button className="qty-btn" onClick={() => updateInventory(p.id, qty + 1)}>+</button>
              </div>
            </div>
          );
        })}
      </div>
      
      <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
        在庫を確定して発注へ
      </button>
    </div>
  );
};

// ==========================================
// ProductMaster Component
// ==========================================
const ProductMaster = () => {
  const { products } = useStore();
  
  return (
    <div className="product-master">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>商品マスタ管理</h2>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', width: 'auto' }}>
          ＋ 新規追加
        </button>
      </div>

      <div className="card" style={{ padding: '0' }}>
        {products.map((p, idx) => (
          <div key={p.id} className="list-item" style={{ padding: '1rem', borderBottom: idx === products.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
            <div className="item-info">
              <h3>{p.name}</h3>
              <p>単位: {p.unit} / 基準在庫: {p.baseQuantity}</p>
            </div>
            <div className="item-action">
              <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', width: 'auto' }}>編集</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// Settings Component
// ==========================================
const Settings = () => {
  return (
    <div className="settings">
      <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>設定</h2>
      
      <div className="card" style={{ padding: '0', marginBottom: '1rem' }}>
        <div className="list-item" style={{ padding: '1rem' }}>
          <div className="item-info">
            <h3>店舗情報設定</h3>
            <p>店舗名、住所、電話番号の変更</p>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>▶︎</span>
        </div>
        <div className="list-item" style={{ padding: '1rem' }}>
          <div className="item-info">
            <h3>発注先連携</h3>
            <p>仕入れ業者への自動FAX・メール送信設定</p>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>▶︎</span>
        </div>
        <div className="list-item" style={{ padding: '1rem', borderBottom: 'none' }}>
          <div className="item-info">
            <h3>通知設定</h3>
            <p>LINE・メールへのアラート通知</p>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>▶︎</span>
        </div>
      </div>
      
      <button className="btn btn-outline" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>
        ログアウト
      </button>
    </div>
  );
};

// ==========================================
// App Root Component
// ==========================================
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
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'inventory' && <InventoryInput />}
        {activeTab === 'products' && <ProductMaster />}
        {activeTab === 'settings' && <Settings />}
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
        <button 
          className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <span className="nav-icon">📋</span>
          商品マスタ
        </button>
        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="nav-icon">⚙️</span>
          設定
        </button>
      </nav>
    </div>
  );
}

export default App;
