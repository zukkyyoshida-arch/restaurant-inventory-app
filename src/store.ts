import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string; // 現場での呼び名（例：ポテト）
  officialName?: string; // 業者向けの正式名称
  category?: string; // カテゴリ
  storageLocation?: string; // 保管場所
  supplier?: string; // 取引先
  spec?: string; // 規格・入数
  unitPrice?: number; // 仕入単価
  leadTimeDays?: number; // リードタイム（日数）
  reorderPoint?: number; // 発注点
  unit: string;
  baseQuantity: number; // 基準在庫
  lastWeekConsumption: number; // 先週同曜日の消費量
  expiresInDays?: number; // 消費期限までの日数 (nullなら無し)
}

export interface AppSettings {
  aiStrategy: 'loss-zero' | 'balanced' | 'avoid-shortage';
  locationType: 'office' | 'residential' | 'tourist' | 'other';
  requirePinForMaster: boolean;
  autoOrderEnabled: boolean;
  autoOrderTime: string;
  targetCostRate: number;
}

export interface OrderHistoryItem {
  id: string;
  date: string;
  items: { productId: string; productName: string; quantity: number; cost: number }[];
  totalAmount: number;
}

interface StoreState {
  products: Product[];
  currentInventory: Record<string, number>;
  orderQuantities: Record<string, number>;
  updateInventory: (productId: string, quantity: number) => void;
  updateOrderQuantity: (productId: string, quantity: number) => void;
  calculateRecommendedOrder: (productId: string) => number;
  addProduct: (product: Omit<Product, 'id'>) => void;
  editProduct: (id: string, updatedData: Partial<Product>) => void;
  clearOrders: () => void;
  resetAll: () => void;
  appSettings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  orderHistory: OrderHistoryItem[];
  saveOrderHistory: (items: { productId: string; productName: string; quantity: number; cost: number }[]) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: [
        { id: 'p1', name: '餃子の皮 (大判)', officialName: '特製餃子皮 Lサイズ', category: '食材', storageLocation: '冷蔵室A', supplier: '〇〇製麺', spec: '100枚/PC', unitPrice: 350, leadTimeDays: 1, reorderPoint: 5, unit: 'PC', baseQuantity: 20, lastWeekConsumption: 18, expiresInDays: 3 },
        { id: 'p2', name: '豚ひき肉', officialName: '国産豚挽肉 (粗挽き)', category: '肉類', storageLocation: '冷蔵室B', supplier: 'プレコフーズ', spec: '2kg/PC', unitPrice: 2400, leadTimeDays: 1, reorderPoint: 3, unit: 'PC', baseQuantity: 10, lastWeekConsumption: 9, expiresInDays: 2 },
        { id: 'p3', name: '大根 (おでん用)', officialName: '千葉産 大根', category: '野菜', storageLocation: '野菜室', supplier: '八百屋', spec: '1本', unitPrice: 180, leadTimeDays: 1, reorderPoint: 5, unit: '本', baseQuantity: 10, lastWeekConsumption: 8 },
        { id: 'p4', name: '牛すじ', officialName: '国産 牛すじ肉', category: '肉類', storageLocation: '冷凍庫', supplier: 'プレコフーズ', spec: '1kg/PC', unitPrice: 1200, leadTimeDays: 1, reorderPoint: 2, unit: 'PC', baseQuantity: 5, lastWeekConsumption: 4 },
        { id: 'p5', name: 'サントリー 翠 (SUI)', officialName: 'サントリー 翠 (SUI) 1.8L', category: '飲料', storageLocation: '酒庫', supplier: '(株)カクヤス', spec: '1.8L/本', unitPrice: 3200, leadTimeDays: 0, reorderPoint: 3, unit: '本', baseQuantity: 8, lastWeekConsumption: 10 },
        { id: 'p6', name: '炭酸水', officialName: 'ウィルキンソン 炭酸 500ml', category: '飲料', storageLocation: '冷蔵ショーケース', supplier: '(株)カクヤス', spec: '24本/CS', unitPrice: 1800, leadTimeDays: 0, reorderPoint: 2, unit: 'CS', baseQuantity: 4, lastWeekConsumption: 5 },
      ],
      // 現在の在庫数
      currentInventory: {
        'p1': 1,
        'p2': 15,
        'p3': 8,
        'p4': 1,
        'p5': 2,
      },
      // ユーザーが調整した発注量（初期状態は空、必要に応じて計算される）
      orderQuantities: {},
      
      // アプリの設定
      appSettings: {
        aiStrategy: 'loss-zero',
        locationType: 'tourist',
        requirePinForMaster: false,
        autoOrderEnabled: false,
        autoOrderTime: '15:00',
        targetCostRate: 28,
      },
      
      // 発注履歴
      orderHistory: [],
      
      updateInventory: (productId, quantity) => set((state) => ({
        currentInventory: { ...state.currentInventory, [productId]: Math.max(0, quantity) }
      })),
      
      updateOrderQuantity: (productId, quantity) => set((state) => ({
        orderQuantities: { ...state.orderQuantities, [productId]: Math.max(0, quantity) }
      })),
      
      calculateRecommendedOrder: (productId: string) => {
        const state = get();
        const product = state.products.find(p => p.id === productId);
        const currentQty = state.currentInventory[productId] || 0;
        if (!product) return 0;
        
        const recommended = product.baseQuantity - currentQty;
        return recommended > 0 ? recommended : 0;
      },
      
      addProduct: (newProduct) => set((state) => {
        const newId = `p${Date.now()}`;
        return {
          products: [...state.products, { ...newProduct, id: newId } as Product]
        };
      }),
      
      editProduct: (id, updatedData) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updatedData } : p)
      })),
      
      clearOrders: () => set({ orderQuantities: {} }),
      
      updateSettings: (newSettings) => set((state) => ({
        appSettings: { ...state.appSettings, ...newSettings }
      })),
      
      saveOrderHistory: (items) => set((state) => {
        const totalAmount = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
        const newHistory: OrderHistoryItem = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          items,
          totalAmount
        };
        return { orderHistory: [newHistory, ...state.orderHistory] };
      }),

      resetAll: () => set({
        currentInventory: {},
        orderQuantities: {},
        orderHistory: []
      })
    }),
    {
      name: 'loss-zero-storage-v7', // LocalStorageのキーを変更してキャッシュをクリア
    }
  )
);
