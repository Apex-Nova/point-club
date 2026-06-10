import { supabase } from '../supabase';

export interface MarketplaceItem {
  id:             string;
  seller_id:      string;
  title:          string;
  description:    string | null;
  type:           'brush_pack' | 'template' | 'color_palette' | 'creative_kit' | 'world_asset';
  price_cents:    number;
  preview_url:    string | null;
  tags:           string[];
  like_count:     number;
  purchase_count: number;
  is_published:   boolean;
  created_at:     string;
  seller:         { username: string | null; avatar_url: string | null } | null;
  is_purchased?:  boolean;
  rating?:        number;
}

export async function getMarketplaceItems(opts: {
  type?: string; sort?: 'popular' | 'new' | 'free'; limit?: number;
} = {}): Promise<MarketplaceItem[]> {
  const { type, sort = 'popular', limit = 24 } = opts;
  let q = supabase
    .from('marketplace_items')
    .select('*, seller:profiles!seller_id(username,avatar_url)')
    .eq('is_published', true);
  if (type && type !== 'all') q = q.eq('type', type);
  if (sort === 'new')     q = q.order('created_at',     { ascending: false });
  else if (sort === 'free') q = q.eq('price_cents', 0).order('purchase_count', { ascending: false });
  else                    q = q.order('purchase_count', { ascending: false });
  const { data } = await q.limit(limit);
  return (data ?? []) as unknown as MarketplaceItem[];
}

export async function purchaseItem(itemId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('marketplace_purchases').insert({ item_id: itemId, user_id: user.id, price_paid: 0 });
  // Increment purchase count
  await supabase.rpc('increment' as never, { table: 'marketplace_items', column: 'purchase_count', row_id: itemId } as never).catch(() => {});
}

export async function hasPurchased(itemId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('marketplace_purchases')
    .select('item_id').eq('item_id', itemId).eq('buyer_id', user.id).maybeSingle();
  return Boolean(data);
}

export async function listItem(item: Omit<MarketplaceItem, 'id' | 'seller_id' | 'like_count' | 'purchase_count' | 'is_published' | 'created_at' | 'seller'>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('marketplace_items').insert({ ...item, seller_id: user.id, is_published: true });
}

export async function addToWishlist(itemId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('marketplace_wishlists').insert({ user_id: user.id, item_id: itemId });
}

export async function getSellerEarnings(): Promise<{ total_cents: number; items_sold: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total_cents: 0, items_sold: 0 };
  const { data } = await supabase
    .from('marketplace_purchases')
    .select('price_paid, marketplace_items!inner(seller_id)')
    .eq('marketplace_items.seller_id', user.id);
  const total = ((data ?? []) as { price_paid: number }[]).reduce((s, r) => s + r.price_paid, 0);
  return { total_cents: total, items_sold: (data ?? []).length };
}
