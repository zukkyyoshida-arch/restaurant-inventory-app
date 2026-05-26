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
const Dashboard = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { products, currentInventory, orderQuantities, updateOrderQuantity, calculateRecommendedOrder, clearOrders } = useStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&daily=weathercode,temperature_2m_max,precipitation_probability_max&timezone=Asia%2FTokyo');
        const data = await res.json();
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

  const handleSuggestMenu = () => {
    alert("💡 本日のAI裏メニュー提案:\n\n『鶏もも肉とトマトのガーリック煮込み』\n\n消費期限が近い食材を組み合わせて、ロスを減らしましょう！");
  };

  const handleSubmitOrder = () => {
    const orderCount = Object.keys(orderQuantities).length;
    if (orderCount === 0) {
      alert("発注する商品がありません。数量を＋で追加してください。");
      return;
    }
    alert(`🛒 業者システムへ発注データを送信しました！（${orderCount}件）`);
    clearOrders();
  };

  const expiringProducts = products.filter(p => p.expiresInDays !== undefined && p.expiresInDays <= 2);
  const needsOrdering = products.filter(p => {
    const recommended = calculateRecommendedOrder(p.id);
    const currentOrder = orderQuantities[p.id] !== undefined ? orderQuantities[p.id] : recommended;
    return recommended > 0 || currentOrder > 0;
  });

  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-title"><span>🌦️</span> AI需要予測（明日の天気）</div>
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

      <div className="card">
        <div className="card-title"><span>⚠️</span> アラート：消費期限間近</div>
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
        <button className="btn btn-outline" style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.875rem' }} onClick={handleSuggestMenu}>
          💡 余り食材で「裏メニュー」を提案
        </button>
      </div>

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
                  {p.officialName && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      業者向け名称: {p.officialName}
                    </p>
                  )}
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
      
      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleSubmitOrder}>
        まとめて発注する
      </button>
    </div>
  );
};

// ==========================================
// InventoryInput Component
// ==========================================
const InventoryInput = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { products, currentInventory, updateInventory } = useStore();

  const handleVoiceInput = () => {
    const input = prompt("🎤 音声入力シミュレーション\n例：「トマトを25個」などと入力してください（デモとしてトマトの在庫が強制更新されます）");
    if (input) {
      updateInventory('p2', 25);
      alert("AI解析完了: トマトの在庫を「25個」に更新しました！");
    }
  };

  const handleConfirmInventory = () => {
    alert("✅ 本日の在庫を保存しました。\n\nダッシュボードからAIの推奨発注リストを確認してください。");
    setActiveTab('dashboard');
  };

  return (
    <div className="inventory-input">
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--primary-color)', color: 'white' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>🎤 音声でサクッと棚卸し</h2>
        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
          「キャベツ3玉、トマト5個」のように話しかけてください。
        </p>
        <button className="btn" style={{ backgroundColor: 'white', color: 'var(--primary-color)', marginTop: '1rem' }} onClick={handleVoiceInput}>
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
              <div className="item-info" style={{ flex: 1, paddingRight: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{p.name} ({p.unit})</h3>
                {p.officialName && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', lineHeight: '1.2' }}>
                    正式名: {p.officialName}
                  </p>
                )}
                <p style={{ fontSize: '0.875rem' }}>昨日: {qty} {p.unit}</p>
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
      
      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleConfirmInventory}>
        在庫を確定して発注へ
      </button>
    </div>
  );
};

// ==========================================
// ProductMaster Component
// ==========================================
const ProductMaster = () => {
  const { products, addProduct, editProduct } = useStore();
  
  const handleAdd = () => {
    const name = prompt("追加する新しい商品名を入力してください:");
    if (name) {
      addProduct({ name, unit: '個', baseQuantity: 10, lastWeekConsumption: 0 });
      alert(`「${name}」を商品マスタに追加しました！`);
    }
  };

  const handleEdit = (id: string, currentName: string) => {
    const newName = prompt("商品名の変更:", currentName);
    if (newName && newName !== currentName) {
      editProduct(id, newName);
    }
  };

  return (
    <div className="product-master">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>商品マスタ管理</h2>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', width: 'auto' }} onClick={handleAdd}>
          ＋ 新規追加
        </button>
      </div>

      <div className="card" style={{ padding: '0' }}>
        {products.map((p, idx) => (
          <div key={p.id} className="list-item" style={{ padding: '1rem', borderBottom: idx === products.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
            <div className="item-info" style={{ paddingRight: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem' }}>{p.name}</h3>
              {p.officialName && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{p.officialName}</p>
              )}
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>単位: {p.unit} / 基準在庫: {p.baseQuantity}</p>
            </div>
            <div className="item-action">
              <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', width: 'auto' }} onClick={() => handleEdit(p.id, p.name)}>編集</button>
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
const Settings = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { resetAll } = useStore();

  const handleLogout = () => {
    if (confirm("本当にログアウトしますか？\n（デモとして保存されたデータがすべてリセットされます）")) {
      resetAll();
      alert("データを初期化しました。");
      setActiveTab('dashboard');
    }
  };

  const handleNotImplemented = (feature: string) => {
    alert(`「${feature}」設定画面は現在開発中（モック）です。`);
  };

  return (
    <div className="settings">
      <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>設定</h2>
      
      <div className="card" style={{ padding: '0', marginBottom: '1rem' }}>
        <div className="list-item" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleNotImplemented('店舗情報')}>
          <div className="item-info">
            <h3>店舗情報設定</h3>
            <p>店舗名、住所、電話番号の変更</p>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>▶︎</span>
        </div>
        <div className="list-item" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleNotImplemented('発注先連携')}>
          <div className="item-info">
            <h3>発注先連携</h3>
            <p>仕入れ業者への自動FAX・メール送信設定</p>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>▶︎</span>
        </div>
        <div className="list-item" style={{ padding: '1rem', borderBottom: 'none', cursor: 'pointer' }} onClick={() => handleNotImplemented('通知設定')}>
          <div className="item-info">
            <h3>通知設定</h3>
            <p>LINE・メールへのアラート通知</p>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>▶︎</span>
        </div>
      </div>
      
      <button className="btn btn-outline" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={handleLogout}>
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
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'inventory' && <InventoryInput setActiveTab={setActiveTab} />}
        {activeTab === 'products' && <ProductMaster />}
        {activeTab === 'settings' && <Settings setActiveTab={setActiveTab} />}
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
