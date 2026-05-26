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
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: [
        { id: 'p6', name: 'フライドポテト', officialName: 'ラムウェストン SO1ステルスジュリエンヌ スキンオン', category: '冷凍食品', storageLocation: '冷凍庫A', supplier: '(株)久世', spec: '4LB・6/PC', unitPrice: 1522, leadTimeDays: 1, reorderPoint: 5, unit: 'PC', baseQuantity: 10, lastWeekConsumption: 8 },
        { id: 'p1', name: 'キャベツ', officialName: '国産 キャベツ (L玉)', category: '野菜', storageLocation: '冷蔵室', supplier: '八百屋', spec: '1玉', unitPrice: 150, leadTimeDays: 1, reorderPoint: 2, unit: '玉', baseQuantity: 5, lastWeekConsumption: 5 },
        { id: 'p2', name: 'トマト', officialName: 'カゴメ グリルトマト（ダイスカット）', category: '野菜', storageLocation: '冷蔵室', supplier: '(株)久世', spec: '500g・10/PC', unitPrice: 714, leadTimeDays: 1, reorderPoint: 10, unit: 'PC', baseQuantity: 30, lastWeekConsumption: 25, expiresInDays: 2 },
        { id: 'p3', name: '玉ねぎ', officialName: '玉ねぎ (L)', category: '野菜', storageLocation: '常温棚', supplier: '八百屋', spec: '1個', unitPrice: 50, leadTimeDays: 1, reorderPoint: 5, unit: '個', baseQuantity: 20, lastWeekConsumption: 15 },
        { id: 'p4', name: '生ビール', officialName: 'アサヒ スーパードライ 樽生 10L', category: '飲料', storageLocation: '酒庫', supplier: '(株)カクヤス', spec: '10L/樽', unitPrice: 5500, leadTimeDays: 0, reorderPoint: 1, unit: '樽', baseQuantity: 3, lastWeekConsumption: 4 },
        { id: 'p5', name: 'ピザ生地', officialName: 'ハッコー 生ピザボール', category: '生地', storageLocation: '冷蔵室', supplier: 'プレコフーズ', spec: '150g×12×5・1/C/S', unitPrice: 6195, leadTimeDays: 1, reorderPoint: 2, unit: 'C/S', baseQuantity: 5, lastWeekConsumption: 4, expiresInDays: 1 },
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
          products: [...state.products, { ...newProduct, id: newId } as Product]
        };
      }),
      
      editProduct: (id, updatedData) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updatedData } : p)
      })),
      
      clearOrders: () => set({ orderQuantities: {} }),
      
      resetAll: () => set({
        currentInventory: {},
        orderQuantities: {}
      })
    }),
    {
      name: 'loss-zero-storage-v3', // LocalStorageのキーを変更してキャッシュをクリア
    }
  )
);
