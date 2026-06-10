-- ============================================================
-- Point Club — Phase 7 Database Migration
-- Monetization, Marketplace, Communities, Search, Admin
-- ============================================================

-- ── Subscription tiers ────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin          boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_id   text,
  ADD COLUMN IF NOT EXISTS subscription_status text       DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS creator_balance   integer     NOT NULL DEFAULT 0, -- in cents
  ADD COLUMN IF NOT EXISTS commission_open   boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_rate   integer     NOT NULL DEFAULT 1000, -- cents per hour
  ADD COLUMN IF NOT EXISTS referral_code     text        UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by       uuid        REFERENCES profiles(id);

-- Subscription events log
CREATE TABLE IF NOT EXISTS subscription_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type    text        NOT NULL, -- created | updated | canceled | payment_failed
  plan          text        NOT NULL DEFAULT 'free',
  stripe_event_id text      UNIQUE,
  metadata      jsonb       DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Marketplace ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_items (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  description    text,
  type           text        NOT NULL DEFAULT 'brush_pack'
                 CHECK (type IN ('brush_pack','template','color_palette','creative_kit','world_asset')),
  price_cents    integer     NOT NULL DEFAULT 0, -- 0 = free
  preview_url    text,
  download_url   text,
  tags           text[]      DEFAULT '{}',
  like_count     integer     NOT NULL DEFAULT 0,
  purchase_count integer     NOT NULL DEFAULT 0,
  is_published   boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mi_seller_idx  ON marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS mi_type_idx    ON marketplace_items(type, is_published);
CREATE INDEX IF NOT EXISTS mi_popular_idx ON marketplace_items(purchase_count DESC) WHERE is_published = true;

CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid        NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  buyer_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  price_paid  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid        NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  reviewer_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS marketplace_wishlists (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id    uuid NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

-- ── Commissions ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS commissions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text        NOT NULL,
  budget_cents    integer     NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','in_progress','submitted','revision','completed','cancelled')),
  deadline        date,
  deliverable_url text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS com_client_idx  ON commissions(client_id);
CREATE INDEX IF NOT EXISTS com_creator_idx ON commissions(creator_id);

-- ── Tips ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tips (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents integer     NOT NULL CHECK (amount_cents > 0),
  message      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tips_recipient_idx ON tips(recipient_id, created_at DESC);

-- ── Communities ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS communities (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        UNIQUE NOT NULL,
  name        text        NOT NULL,
  description text,
  avatar_url  text,
  banner_url  text,
  category    text        NOT NULL DEFAULT 'general',
  is_private  boolean     NOT NULL DEFAULT false,
  member_count integer    NOT NULL DEFAULT 0,
  post_count  integer     NOT NULL DEFAULT 0,
  owner_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comm_slug_idx     ON communities(slug);
CREATE INDEX IF NOT EXISTS comm_popular_idx  ON communities(member_count DESC);

CREATE TABLE IF NOT EXISTS community_members (
  community_id uuid   NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      uuid   NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         text   NOT NULL DEFAULT 'member' CHECK (role IN ('member','moderator','admin')),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  content      text,
  image_url    text,
  type         text        NOT NULL DEFAULT 'post' CHECK (type IN ('post','challenge','event','announcement')),
  like_count   integer     NOT NULL DEFAULT 0,
  comment_count integer    NOT NULL DEFAULT 0,
  is_pinned    boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cp_community_idx ON community_posts(community_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_post_likes (
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- Trigger: member_count
CREATE OR REPLACE FUNCTION sync_community_members()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS comm_member_trigger ON community_members;
CREATE TRIGGER comm_member_trigger
AFTER INSERT OR DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION sync_community_members();

-- ── Analytics Events ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  session_id  text,
  event       text        NOT NULL,
  properties  jsonb       DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ae_user_idx  ON analytics_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ae_event_idx ON analytics_events(event, occurred_at DESC);

-- Materialized view for platform-level daily stats
CREATE TABLE IF NOT EXISTS platform_metrics (
  date          date        PRIMARY KEY,
  dau           integer     NOT NULL DEFAULT 0,
  new_users     integer     NOT NULL DEFAULT 0,
  drawings_created integer  NOT NULL DEFAULT 0,
  games_played  integer     NOT NULL DEFAULT 0,
  challenges_submitted integer NOT NULL DEFAULT 0,
  revenue_cents integer     NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Referral System ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referrals (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id  uuid        UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  reward_given boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Waitlist ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waitlist (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        UNIQUE NOT NULL,
  name       text,
  source     text,
  metadata   jsonb       DEFAULT '{}',
  invited    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Audit Logs (Enterprise) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  action      text        NOT NULL,
  target_type text,
  target_id   text,
  metadata    jsonb       DEFAULT '{}',
  ip_address  text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS al_actor_idx  ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS al_action_idx ON audit_logs(action, created_at DESC);

-- ── Search index (denormalised) ───────────────────────────────

CREATE TABLE IF NOT EXISTS search_index (
  id          text        PRIMARY KEY,
  type        text        NOT NULL, -- user | room | drawing | community
  title       text        NOT NULL,
  description text,
  image_url   text,
  url         text,
  search_vec  tsvector,
  rank_score  float8      NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS si_search_idx ON search_index USING GIN(search_vec);
CREATE INDEX IF NOT EXISTS si_type_idx   ON search_index(type);

-- Auto-update search_vec
CREATE OR REPLACE FUNCTION update_search_vec()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vec := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS search_vec_trigger ON search_index;
CREATE TRIGGER search_vec_trigger
BEFORE INSERT OR UPDATE ON search_index
FOR EACH ROW EXECUTE FUNCTION update_search_vec();

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE subscription_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;

-- Marketplace: public reads for published items
CREATE POLICY mi_select ON marketplace_items FOR SELECT USING (is_published OR auth.uid() = seller_id);
CREATE POLICY mi_insert ON marketplace_items FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY mi_update ON marketplace_items FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY mi_delete ON marketplace_items FOR DELETE USING (auth.uid() = seller_id);

CREATE POLICY mp_select ON marketplace_purchases FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() IN (SELECT seller_id FROM marketplace_items WHERE id = item_id));
CREATE POLICY mp_insert ON marketplace_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY mr_select ON marketplace_reviews FOR SELECT USING (true);
CREATE POLICY mr_insert ON marketplace_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY mw_all ON marketplace_wishlists FOR ALL USING (auth.uid() = user_id);

-- Commissions: participants only
CREATE POLICY com_select ON commissions FOR SELECT USING (auth.uid() = client_id OR auth.uid() = creator_id);
CREATE POLICY com_insert ON commissions FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY com_update ON commissions FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = creator_id);

-- Tips: own only
CREATE POLICY tips_select ON tips FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY tips_insert ON tips FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Communities: public reads
CREATE POLICY comm_select ON communities FOR SELECT USING (NOT is_private OR auth.uid() IN (SELECT user_id FROM community_members WHERE community_id = id));
CREATE POLICY comm_insert ON communities FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY comm_update ON communities FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY cm_select ON community_members FOR SELECT USING (true);
CREATE POLICY cm_all    ON community_members FOR ALL  USING (auth.uid() = user_id);

CREATE POLICY cpost_select ON community_posts FOR SELECT USING (true);
CREATE POLICY cpost_insert ON community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY cpost_update ON community_posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY cpl_all ON community_post_likes FOR ALL USING (auth.uid() = user_id);

-- Analytics: own only (admin bypasses via service role)
CREATE POLICY ae_insert ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ae_select ON analytics_events FOR SELECT USING (auth.uid() = user_id);

-- Audit: admin only (service role used for writes)
CREATE POLICY al_select ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Search: public
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY si_select ON search_index FOR SELECT USING (true);

-- Seed default communities
INSERT INTO communities (id, slug, name, description, category, owner_id)
SELECT
  gen_random_uuid(), slug, name, description, category,
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1)
FROM (VALUES
  ('game-artists',     'Game Artists',       'Concept art for games, characters & environments', 'gaming'),
  ('ui-designers',     'UI Designers',       'Interface design, wireframes & prototypes',         'design'),
  ('concept-artists',  'Concept Artists',    'Creature design, sci-fi & fantasy concepts',        'art'),
  ('architects',       'Architecture',       'Buildings, spaces & urban sketches',                'architecture'),
  ('startup-builders', 'Startup Builders',   'Whiteboard sessions & product sketches',            'business'),
  ('daily-sketchers',  'Daily Sketchers',    'One drawing every day, no excuses',                 'practice')
) AS t(slug, name, description, category)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
ON CONFLICT (slug) DO NOTHING;
