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
const Dashboard = () => {
  const { products, currentInventory, orderQuantities, updateOrderQuantity, calculateRecommendedOrder, clearOrders, appSettings, saveOrderHistory } = useStore();
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
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const eq = appSettings.cookingEquipments || [];
      const cookMethod = eq.includes('fryer') ? 'フライヤーでサクッと揚げて' : (eq.includes('oven') ? 'オーブンで焼いて' : 'フライパンで炒めて');
      let message = `💡 本日のAI裏メニュー提案:\n\n余剰分の餃子の皮と豚ひき肉を、${cookMethod}「おつまみ一口餃子」として提供しませんか？\n（翠ジンソーダとも相性抜群です）`;
      if (appSettings.snsAutoPost) {
        message += `\n\n📱 店舗公式Instagram・Xに「本日限定！おつまみ一口餃子あります！」と自動投稿しました！`;
      }
      alert(message);
    }, 1500);
  };

  const handleSubmitOrder = () => {
    // 現在の発注リストから HistoryItem 配列を作成
    const historyItems = products
      .filter(p => orderQuantities[p.id] > 0)
      .map(p => ({
        productId: p.id,
        productName: p.name,
        quantity: orderQuantities[p.id],
        cost: p.unitPrice || 0
      }));
    
    if (historyItems.length > 0) {
      saveOrderHistory(historyItems);
    }

    alert("各仕入れ業者への発注データを送信しました。");
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
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span className="badge" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>🎯 目標原価率: {appSettings.targetCostRate}%</span>
        <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
          🧠 AI戦略: {appSettings.aiStrategy === 'loss-zero' ? '廃棄ゼロ優先' : appSettings.aiStrategy === 'balanced' ? 'バランス重視' : '品切れ回避優先'}
        </span>
        {appSettings.autoOrderEnabled && (
          <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>🚀 自動発注: {appSettings.autoOrderTime}に実行</span>
        )}
      </div>

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
                ? '今夜から明朝にかけて雨の確率が高いため、ゴールデン街付近の深夜の客足が鈍る見込みです。おでんの仕込み量や生鮮食品の発注を少し抑えることをお勧めします。'
                : '今夜は天候が良いため、深夜（翌4時）まで賑わいが見込まれます。翠ジンソーダや餃子の追加仕込みを推奨します！'}
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
                    <h3 style={{ fontSize: '1.1rem' }}>{p.name} {p.isCritical && '⭐'} ({p.unit})</h3>
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
  const { products, currentInventory, updateInventory, appSettings } = useStore();

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
        <h2 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          本日の在庫入力
          {appSettings.voiceInputEnabled && (
            <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)', backgroundColor: 'var(--danger-bg)', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🎙️ 待機中...
            </span>
          )}
        </h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>全商品 ▼</span>
      </div>

      <div className="card" style={{ padding: '0' }}>
        {products.map(p => {
          const qty = currentInventory[p.id] || 0;
          return (
            <div key={p.id} className="list-item" style={{ padding: '1rem' }}>
              <div className="item-info" style={{ flex: 1, paddingRight: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{p.name} {p.isCritical && '⭐'} ({p.unit})</h3>
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
  const { products, addProduct, editProduct, appSettings } = useStore();
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  
  const handlePinCheck = () => {
    if (!appSettings.requirePinForMaster) return true;
    const pin = prompt('【ロックされています】\n店長用の4桁のPINコードを入力してください\n（※デモ用: "1234"で解除できます）');
    if (pin === '1234') return true;
    if (pin !== null) alert('PINコードが違います。');
    return false;
  };

  const openAdd = () => {
    if (!handlePinCheck()) return;
    setFormData({
      name: '', officialName: '', category: '', storageLocation: '', supplier: '', spec: '', unitPrice: 0, leadTimeDays: 1, reorderPoint: 0, unit: '個', baseQuantity: 10, lastWeekConsumption: 0, isCritical: false
    });
    setModalType('add');
  };

  const openEdit = (product: any) => {
    if (!handlePinCheck()) return;
    setEditId(product.id);
    setFormData(product);
    setModalType('edit');
  };
  const handleSubmit = () => {
    if (!formData.name?.trim()) {
      alert('「現場の呼び名」は必須です');
      return;
    }
    if (modalType === 'add') {
      addProduct(formData);
    } else if (modalType === 'edit' && editId) {
      editProduct(editId, formData);
    }
    setModalType(null);
  };

  return (
    <div className="product-master">
      {modalType && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', margin: '0 auto', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem' }}>{modalType === 'add' ? '新しい商品を追加' : '商品情報の編集'}</h3>
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>現場の呼び名 (必須)</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="例: ポテト" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isCritical || false}
                    onChange={(e) => setFormData({ ...formData, isCritical: e.target.checked })}
                  />
                  ⭐ 絶対に切らさない（重要アイテム）に指定
                </label>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>業者向け正式名称</label>
                <input type="text" value={formData.officialName || ''} onChange={e => setFormData({...formData, officialName: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="例: ラムウェストン..." />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>発注単位</label>
                  <input type="text" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="例: PC" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>基準在庫</label>
                  <input type="number" value={formData.baseQuantity || 0} onChange={e => setFormData({...formData, baseQuantity: Number(e.target.value)})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>保管場所</label>
                  <input type="text" value={formData.storageLocation || ''} onChange={e => setFormData({...formData, storageLocation: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="例: 冷蔵庫A" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>取引先</label>
                  <input type="text" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="例: (株)久世" />
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>規格・入数</label>
                <input type="text" value={formData.spec || ''} onChange={e => setFormData({...formData, spec: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="例: 4LB・6/PC" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>仕入単価(円)</label>
                  <input type="number" value={formData.unitPrice || 0} onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>発注点</label>
                  <input type="number" value={formData.reorderPoint || 0} onChange={e => setFormData({...formData, reorderPoint: Number(e.target.value)})} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
              <button className="btn btn-outline" style={{ flex: 1, padding: '0.5rem' }} onClick={() => setModalType(null)}>キャンセル</button>
              <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={handleSubmit}>保存する</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>商品マスタ管理</h2>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', width: 'auto' }} onClick={openAdd}>
          ＋ 新規追加
        </button>
      </div>

      <div className="card" style={{ padding: '0' }}>
        {products.map((p, idx) => (
          <div key={p.id} className="list-item" style={{ padding: '1rem', borderBottom: idx === products.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
            <div className="item-info" style={{ paddingRight: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem' }}>{p.name} {p.isCritical && '⭐'}</h3>
              {p.officialName && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{p.officialName}</p>
              )}
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>単位: {p.unit} / 基準在庫: {p.baseQuantity}</p>
            </div>
            <div className="item-action">
              <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', width: 'auto', pointerEvents: 'auto' }} onClick={() => openEdit(p)}>詳細・編集</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// History Component
// ==========================================
const History = () => {
  const { orderHistory, appSettings } = useStore();

  const totalAmount = orderHistory.reduce((sum, h) => sum + h.totalAmount, 0);

  const assumedSales = 2000000; 
  const targetBudget = assumedSales * (appSettings.targetCostRate / 100);
  const isWarning = totalAmount > targetBudget * 0.8;

  return (
    <div className="history" style={{ paddingBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>月間リザルト ＆ 発注履歴</h2>
      
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: isWarning ? 'var(--danger-bg)' : 'var(--surface-color)', border: isWarning ? '1px solid var(--danger-color)' : 'none' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: isWarning ? 'var(--danger-color)' : 'var(--text-primary)' }}>
          {isWarning ? '⚠️ 目標予算に近づいています' : '✅ 順調なペースです'}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          今月の目標原価率: {appSettings.targetCostRate}% (予算目安: {targetBudget.toLocaleString()}円)
        </p>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: isWarning ? 'var(--danger-color)' : 'var(--primary-color)' }}>
          ¥{totalAmount.toLocaleString()}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>累計発注金額</p>
      </div>

      <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>発注履歴</h3>
      {orderHistory.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>発注履歴がありません</p>
        </div>
      ) : (
        orderHistory.map((history) => (
          <div key={history.id} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {new Date(history.date).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>¥{history.totalAmount.toLocaleString()}</span>
            </div>
            {history.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                <span>{item.productName} × {item.quantity}</span>
                <span>¥{(item.cost * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

// ==========================================
// Settings Component
// ==========================================
const Settings = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { appSettings, updateSettings, resetAll } = useStore();

  const handleLogout = () => {
    if (confirm("本当にリセットしますか？\n（デモとして保存されたデータがすべて初期化されます）")) {
      resetAll();
      alert("データを初期化しました。");
      setActiveTab('dashboard');
    }
  };

  const toggleEquipment = (eq: string) => {
    const current = appSettings.cookingEquipments || [];
    if (current.includes(eq)) {
      updateSettings({ cookingEquipments: current.filter(e => e !== eq) });
    } else {
      updateSettings({ cookingEquipments: [...current, eq] });
    }
  };

  return (
    <div className="settings" style={{ paddingBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>詳細設定</h2>
      
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🧠</span> AI・需要予測設定
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>AIの戦略方針</label>
          <select 
            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            value={appSettings.aiStrategy}
            onChange={(e) => updateSettings({ aiStrategy: e.target.value as any })}
          >
            <option value="loss-zero">廃棄ゼロを最優先（少なめに発注）</option>
            <option value="balanced">バランス重視（デフォルト）</option>
            <option value="avoid-shortage">品切れ回避を最優先（多めに発注）</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>店舗の立地特性</label>
          <select 
            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            value={appSettings.locationType}
            onChange={(e) => updateSettings({ locationType: e.target.value as any })}
          >
            <option value="office">オフィス街（土日・雨天で客数減）</option>
            <option value="residential">住宅街（雨天でも安定）</option>
            <option value="tourist">繁華街・観光地（天候・イベントに大きく依存）</option>
            <option value="other">その他</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>📅 近隣のイベント情報（AI予測用）</label>
          <input 
            type="text" 
            placeholder="例: 今週末はお祭り、明日は花火大会"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            value={appSettings.customEvents || ''}
            onChange={(e) => updateSettings({ customEvents: e.target.value })}
          />
        </div>
      </div>

      {/* 経営・目標設定 */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🎯</span> 経営・目標設定
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>月間の目標原価率 (%)</label>
          <input 
            type="number" 
            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            value={appSettings.targetCostRate}
            onChange={(e) => updateSettings({ targetCostRate: Number(e.target.value) })}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>☀️ 晴れの日目標売上</label>
            <input type="number" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} value={appSettings.sunnyDaySalesTarget} onChange={(e) => updateSettings({ sunnyDaySalesTarget: Number(e.target.value) })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>☔️ 雨の日目標売上</label>
            <input type="number" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} value={appSettings.rainyDaySalesTarget} onChange={(e) => updateSettings({ rainyDaySalesTarget: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      {/* 店舗プロファイル・設備設定 */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🍳</span> 店舗設備（裏メニュー提案用）
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>店舗にある設備をチェックすると、実現可能なレシピのみを提案します。</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={(appSettings.cookingEquipments || []).includes('fryer')} onChange={() => toggleEquipment('fryer')} /> フライヤー</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={(appSettings.cookingEquipments || []).includes('oven')} onChange={() => toggleEquipment('oven')} /> オーブン</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={(appSettings.cookingEquipments || []).includes('microwave')} onChange={() => toggleEquipment('microwave')} /> レンジ</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={(appSettings.cookingEquipments || []).includes('pan')} onChange={() => toggleEquipment('pan')} /> フライパン/鍋</label>
        </div>
      </div>

      {/* 現場オペレーション設定 */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🧑‍🍳</span> 現場オペレーション設定
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>🌍 表示言語（多言語対応）</label>
          <select 
            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            value={appSettings.displayLanguage}
            onChange={(e) => updateSettings({ displayLanguage: e.target.value as any })}
          >
            <option value="ja">日本語</option>
            <option value="en">English (英語)</option>
            <option value="vi">Tiếng Việt (ベトナム語)</option>
            <option value="zh">中文 (中国語)</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>🎙️ ハンズフリー音声入力</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>手が濡れていても声で在庫を入力</p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={appSettings.voiceInputEnabled} onChange={(e) => updateSettings({ voiceInputEnabled: e.target.checked })} />
            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: appSettings.voiceInputEnabled ? 'var(--primary-color)' : '#ccc', borderRadius: '24px', transition: '.4s' }}>
              <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: appSettings.voiceInputEnabled ? '19px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }}></span>
            </span>
          </label>
        </div>
      </div>

      {/* 自動化・外部連携設定 */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🚀</span> 自動化・外部連携設定
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>完全自動発注（オートパイロット）</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>設定時間にAIの推奨値を自動で確定します</p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={appSettings.autoOrderEnabled} onChange={(e) => updateSettings({ autoOrderEnabled: e.target.checked })} />
            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: appSettings.autoOrderEnabled ? 'var(--primary-color)' : '#ccc', borderRadius: '24px', transition: '.4s' }}>
              <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: appSettings.autoOrderEnabled ? '19px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }}></span>
            </span>
          </label>
        </div>
        {appSettings.autoOrderEnabled && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>毎日の実行時間</label>
            <input type="time" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} value={appSettings.autoOrderTime} onChange={(e) => updateSettings({ autoOrderTime: e.target.value })} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>📱 SNS自動告知（裏メニュー用）</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>裏メニュー提案時にInstagram等へ自動投稿</p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={appSettings.snsAutoPost} onChange={(e) => updateSettings({ snsAutoPost: e.target.checked })} />
            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: appSettings.snsAutoPost ? 'var(--primary-color)' : '#ccc', borderRadius: '24px', transition: '.4s' }}>
              <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: appSettings.snsAutoPost ? '19px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }}></span>
            </span>
          </label>
        </div>
      </div>

      {/* セキュリティ・権限 */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔒</span> セキュリティ・権限
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>商品マスタの編集ロック</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>オンにすると追加・編集時にPINを要求します</p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={appSettings.requirePinForMaster} onChange={(e) => updateSettings({ requirePinForMaster: e.target.checked })} />
            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: appSettings.requirePinForMaster ? 'var(--primary-color)' : '#ccc', borderRadius: '24px', transition: '.4s' }}>
              <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: appSettings.requirePinForMaster ? '19px' : '3px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }}></span>
            </span>
          </label>
        </div>
      </div>
      
      <button className="btn btn-outline" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', width: '100%' }} onClick={handleLogout}>
        すべてのデータをリセット (ログアウト)
      </button>
    </div>
  );
};

// ==========================================
// App Root Component
// ==========================================
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { appSettings } = useStore();

  // 簡易的な翻訳モック（現場スタッフ向け）
  const t = (ja: string, en: string, vi: string, zh: string) => {
    switch (appSettings.displayLanguage) {
      case 'en': return en;
      case 'vi': return vi;
      case 'zh': return zh;
      default: return ja;
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>{t('KABUKI餃子 - ロスゼロ', 'KABUKI Gyoza', 'KABUKI Gyoza', 'KABUKI 饺子')}</h1>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
          🥟
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'inventory' && <InventoryInput setActiveTab={setActiveTab} />}
        {activeTab === 'history' && <History />}
        {activeTab === 'products' && <ProductMaster />}
        {activeTab === 'settings' && <Settings setActiveTab={setActiveTab} />}
      </main>

      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="nav-icon">🏠</span>
          {t('ホーム', 'Home', 'Trang chủ', '首页')}
        </button>
        <button 
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <span className="nav-icon">📦</span>
          {t('在庫入力', 'Stock', 'Kho', '库存')}
        </button>
        <button 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="nav-icon">📊</span>
          {t('履歴', 'History', 'Lịch sử', '记录')}
        </button>
        <button 
          className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <span className="nav-icon">📋</span>
          {t('マスタ', 'Master', 'Dữ liệu', '主数据')}
        </button>
        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="nav-icon">⚙️</span>
          {t('設定', 'Settings', 'Cài đặt', '设置')}
        </button>
      </nav>
    </div>
  );
}

export default App;
