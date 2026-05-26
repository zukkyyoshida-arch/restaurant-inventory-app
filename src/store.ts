import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string; // 現場での呼び名（例：ポテト）
  officialName?: string; // 業者向けの正式名称
  unit: string;
  baseQuantity: number; // 基準在庫
  lastWeekConsumption: number; // 先週同曜日の消費量
  expiresInDays?: number; // 消費期限までの日数 (nullなら無し)
}

interface StoreState {
  products: Product[];
  currentInventory: Record<string, number>;
  orderQuantities: Record<string, number>;
  updateInventory: (productId: string, quantity: number) => void;
  updateOrderQuantity: (productId: string, quantity: number) => void;
  calculateRecommendedOrder: (productId: string) => number;
  addProduct: (product: Omit<Product, 'id'>) => void;
  editProduct: (id: string, name: string) => void;
  clearOrders: () => void;
  resetAll: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: [
        { id: 'p6', name: 'フライドポテト', officialName: 'ラムウェストン SO1ステルスジュリエンヌ スキンオン', unit: 'PC', baseQuantity: 10, lastWeekConsumption: 8 },
        { id: 'p1', name: 'キャベツ', officialName: '国産 キャベツ (L玉)', unit: '玉', baseQuantity: 5, lastWeekConsumption: 5 },
        { id: 'p2', name: 'トマト', officialName: 'カゴメ グリルトマト（ダイスカット）', unit: 'PC', baseQuantity: 30, lastWeekConsumption: 25, expiresInDays: 2 },
        { id: 'p3', name: '玉ねぎ', unit: '個', baseQuantity: 20, lastWeekConsumption: 15 },
        { id: 'p4', name: '生ビール', officialName: 'アサヒ スーパードライ 樽生 10L', unit: '樽', baseQuantity: 3, lastWeekConsumption: 4 },
        { id: 'p5', name: 'ピザ生地', officialName: 'ハッコー 生ピザボール', unit: 'C/S', baseQuantity: 5, lastWeekConsumption: 4, expiresInDays: 1 },
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
          products: [...state.products, { ...newProduct, id: newId }]
        };
      }),
      
      editProduct: (id, name) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, name } : p)
      })),
      
      clearOrders: () => set({ orderQuantities: {} }),
      
      resetAll: () => set({
        currentInventory: {},
        orderQuantities: {}
      })
    }),
    {
      name: 'loss-zero-storage-v2', // LocalStorageのキーを変更してキャッシュをクリア
    }
  )
);
