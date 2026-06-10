-- ============================================================
-- Point Club — Phase 8b Supplementary Migration
-- World Events, Recommendations, Automation Signals,
-- Ambassador Program, Security & Compliance
-- ============================================================

-- ── World Events ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS world_events (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text        NOT NULL,
  slug              text        UNIQUE NOT NULL,
  description       text,
  type              text        NOT NULL DEFAULT 'monthly_challenge'
                    CHECK (type IN ('global_art_week','world_canvas','monthly_challenge','competition','workshop','festival')),
  status            text        NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming','live','ended')),
  banner_url        text,
  starts_at         timestamptz NOT NULL,
  ends_at           timestamptz NOT NULL,
  prize_pool        integer,         -- cents
  xp_reward         integer     NOT NULL DEFAULT 100,
  participant_count integer     NOT NULL DEFAULT 0,
  tags              text[]      DEFAULT '{}',
  created_by        uuid        REFERENCES profiles(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS we_status_idx ON world_events(status, starts_at);

CREATE TABLE IF NOT EXISTS event_registrations (
  event_id        uuid        NOT NULL REFERENCES world_events(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS er_user_idx ON event_registrations(user_id);

CREATE TABLE IF NOT EXISTS event_submissions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid        NOT NULL REFERENCES world_events(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  drawing_id      uuid        REFERENCES drawings(id),
  drawing_url     text,
  votes           integer     NOT NULL DEFAULT 0,
  rank            integer,
  submitted_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS es_event_votes ON event_submissions(event_id, votes DESC);

-- ── Recommendation Engine ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS recommendation_signals (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signal_type  text        NOT NULL CHECK (signal_type IN ('view','like','save','follow','purchase','complete','share','skip')),
  entity_type  text        NOT NULL CHECK (entity_type IN ('drawing','creator','challenge','course','community','room')),
  entity_id    text        NOT NULL,
  duration_ms  integer,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rs_user_idx  ON recommendation_signals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rs_entity_idx ON recommendation_signals(entity_type, entity_id);

-- ── Ambassador Program ─────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ambassador_status text DEFAULT 'none'
    CHECK (ambassador_status IN ('none','pending','active','suspended')),
  ADD COLUMN IF NOT EXISTS ambassador_tier   text DEFAULT 'advocate'
    CHECK (ambassador_tier IN ('advocate','creator','champion','legend'));

CREATE TABLE IF NOT EXISTS ambassador_applications (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  notes         text,
  applied_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid        REFERENCES profiles(id)
);
CREATE INDEX IF NOT EXISTS aa_user_idx ON ambassador_applications(user_id);

-- Track ambassador-referred conversions (extends existing referrals)
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS commission_paid  boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_cents integer     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_at          timestamptz;

-- ── Security & Audit Logging ───────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  action       text        NOT NULL,
  resource     text        NOT NULL,
  resource_id  text,
  ip_address   inet,
  user_agent   text,
  metadata     jsonb       DEFAULT '{}',
  status       text        NOT NULL DEFAULT 'success'
               CHECK (status IN ('success','failed','warning')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS al_user_idx   ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS al_action_idx ON audit_logs(action, created_at DESC);

CREATE TABLE IF NOT EXISTS user_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_info  text,
  ip_address   inet,
  location     text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_current   boolean     DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS us_user_idx ON user_sessions(user_id, last_seen_at DESC);

-- ── Data Export Requests (GDPR/CCPA) ──────────────────────────

CREATE TABLE IF NOT EXISTS data_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         text        NOT NULL CHECK (type IN ('export','delete','rectify')),
  status       text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','processing','completed','rejected')),
  download_url text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- ── Scalability: Caching & CDN hints ──────────────────────────

-- Materialized view for hot gallery content (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS gallery_hot AS
  SELECT
    d.id, d.title, d.thumbnail_url, d.like_count, d.view_count,
    d.created_at, p.username, p.avatar_url,
    (d.like_count * 2 + d.view_count + d.save_count * 3) AS hot_score
  FROM drawings d
  JOIN profiles p ON p.id = d.user_id
  WHERE d.is_public = true AND d.created_at > now() - interval '7 days'
  ORDER BY hot_score DESC
  LIMIT 500;

CREATE UNIQUE INDEX IF NOT EXISTS gallery_hot_id ON gallery_hot(id);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE world_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests        ENABLE ROW LEVEL SECURITY;

-- Events: public read
CREATE POLICY we_select  ON world_events FOR SELECT USING (true);
CREATE POLICY we_insert  ON world_events FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY we_update  ON world_events FOR UPDATE USING (auth.role() = 'service_role');

-- Registrations: own
CREATE POLICY er_all ON event_registrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY er_select_all ON event_registrations FOR SELECT USING (true);

-- Submissions: public read, own write
CREATE POLICY es_select ON event_submissions FOR SELECT USING (true);
CREATE POLICY es_all    ON event_submissions FOR ALL    USING (auth.uid() = user_id);

-- Signals: own only
CREATE POLICY rs_all ON recommendation_signals FOR ALL USING (auth.uid() = user_id);

-- Ambassador: own
CREATE POLICY aa_all ON ambassador_applications FOR ALL USING (auth.uid() = user_id);

-- Audit: own read
CREATE POLICY al_select ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY al_insert ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Sessions: own
CREATE POLICY us_all ON user_sessions FOR ALL USING (auth.uid() = user_id);

-- Data requests: own
CREATE POLICY dr_all ON data_requests FOR ALL USING (auth.uid() = user_id);
