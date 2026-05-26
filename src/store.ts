import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  unit: string;
  baseQuantity: number; // 基準在庫
  lastWeekConsumption: number; // 先週同曜日の消費量
  expiresInDays?: number; // 消費期限までの日数 (nullなら無し)
}

interface StoreState {
  products: Product[];
  currentInventory: Record<string, number>; // productId -> quantity
  orderQuantities: Record<string, number>; // productId -> order quantity
  updateInventory: (productId: string, quantity: number) => void;
  updateOrderQuantity: (productId: string, quantity: number) => void;
  calculateRecommendedOrder: (productId: string) => number;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // モックの商品マスタデータ
      products: [
        { id: 'p1', name: 'キャベツ', unit: '玉', baseQuantity: 5, lastWeekConsumption: 5 },
        { id: 'p2', name: 'トマト', unit: '個', baseQuantity: 30, lastWeekConsumption: 25, expiresInDays: 2 },
        { id: 'p3', name: '玉ねぎ', unit: '個', baseQuantity: 20, lastWeekConsumption: 15 },
        { id: 'p4', name: 'ビール', unit: '樽', baseQuantity: 3, lastWeekConsumption: 4 },
        { id: 'p5', name: '鶏もも肉', unit: 'kg', baseQuantity: 5, lastWeekConsumption: 4, expiresInDays: 1 },
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
        
        // 簡易的な計算式: (基準在庫 - 現在の在庫)
        // ※実際には天候や昨年の実績などを加味する
        const recommended = product.baseQuantity - currentQty;
        return recommended > 0 ? recommended : 0;
      }
    }),
    {
      name: 'loss-zero-storage', // LocalStorageのキー
    }
  )
);
