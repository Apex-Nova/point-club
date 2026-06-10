-- ============================================================
-- Point Club — Phase 6 Database Migration
-- Games, Gallery, XP, Challenges, World Canvas, Premium
-- ============================================================

-- ── XP & Levels ───────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp            integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level         integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp_this_week  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS premium_tier  text    NOT NULL DEFAULT 'free' -- free | pro | studio
                           CHECK (premium_tier IN ('free','pro','studio')),
  ADD COLUMN IF NOT EXISTS frames        text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS equipped_frame text   DEFAULT NULL;

-- XP transaction log
CREATE TABLE IF NOT EXISTS xp_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source      text        NOT NULL,   -- draw | battle_win | challenge | collaborate | etc.
  amount      integer     NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS xp_events_user_idx ON xp_events(user_id, created_at DESC);

-- Trigger: keep profiles.xp in sync
CREATE OR REPLACE FUNCTION sync_profile_xp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles
  SET xp    = xp    + NEW.amount,
      level = GREATEST(1, FLOOR(SQRT((xp + NEW.amount)::float / 100))::int + 1)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS xp_sync_trigger ON xp_events;
CREATE TRIGGER xp_sync_trigger
AFTER INSERT ON xp_events
FOR EACH ROW EXECUTE FUNCTION sync_profile_xp();

-- ── Games ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS games (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text        NOT NULL DEFAULT 'battle'
                CHECK (type IN ('battle','guess','blind','story','free_for_all','tournament')),
  status        text        NOT NULL DEFAULT 'lobby'
                CHECK (status IN ('lobby','countdown','drawing','voting','results','finished')),
  host_id       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  prompt        text,
  max_players   integer     NOT NULL DEFAULT 8,
  round_time_s  integer     NOT NULL DEFAULT 90,
  current_round integer     NOT NULL DEFAULT 0,
  max_rounds    integer     NOT NULL DEFAULT 3,
  is_public     boolean     NOT NULL DEFAULT true,
  room_code     text        UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  finished_at   timestamptz
);
CREATE INDEX IF NOT EXISTS games_status_idx  ON games(status);
CREATE INDEX IF NOT EXISTS games_type_idx    ON games(type);
CREATE INDEX IF NOT EXISTS games_public_idx  ON games(is_public, status);

-- Game participants
CREATE TABLE IF NOT EXISTS game_participants (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id     uuid        NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  username    text        NOT NULL DEFAULT 'Guest',
  score       integer     NOT NULL DEFAULT 0,
  is_drawer   boolean     NOT NULL DEFAULT false,
  joined_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gp_game_idx ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS gp_user_idx ON game_participants(user_id);

-- Game submissions (drawings per round)
CREATE TABLE IF NOT EXISTS game_submissions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id     uuid        NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  username    text        NOT NULL DEFAULT 'Guest',
  round       integer     NOT NULL DEFAULT 1,
  canvas_data text,       -- base64 PNG thumbnail
  vote_count  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gs_game_idx ON game_submissions(game_id, round);

-- ── Daily Challenges ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_challenges (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date        NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  prompt        text        NOT NULL,
  theme         text,
  difficulty    text        NOT NULL DEFAULT 'medium'
                CHECK (difficulty IN ('easy','medium','hard','expert')),
  xp_reward     integer     NOT NULL DEFAULT 50,
  badge_reward  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_entries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    uuid        NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  drawing_id      uuid        REFERENCES drawings(id) ON DELETE SET NULL,
  canvas_snapshot text,       -- base64 PNG
  like_count      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);
CREATE INDEX IF NOT EXISTS ce_challenge_idx ON challenge_entries(challenge_id, like_count DESC);

-- ── Public Gallery ─────────────────────────────────────────────

ALTER TABLE drawings
  ADD COLUMN IF NOT EXISTS is_public    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS like_count   integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count   integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags         text[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE TABLE IF NOT EXISTS drawing_likes (
  drawing_id  uuid        NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (drawing_id, user_id)
);

CREATE TABLE IF NOT EXISTS drawing_comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id  uuid        NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username    text        NOT NULL DEFAULT 'Anonymous',
  content     text        NOT NULL CHECK (char_length(content) <= 500),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dc_drawing_idx ON drawing_comments(drawing_id, created_at);

CREATE TABLE IF NOT EXISTS drawing_saves (
  drawing_id  uuid        NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (drawing_id, user_id)
);

-- Trigger: keep like_count in sync
CREATE OR REPLACE FUNCTION sync_drawing_likes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE drawings SET like_count = like_count + 1 WHERE id = NEW.drawing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE drawings SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.drawing_id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS drawing_likes_trigger ON drawing_likes;
CREATE TRIGGER drawing_likes_trigger
AFTER INSERT OR DELETE ON drawing_likes
FOR EACH ROW EXECUTE FUNCTION sync_drawing_likes();

-- ── Infinite World Canvas ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS world_sectors (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_x    integer     NOT NULL,
  sector_y    integer     NOT NULL,
  strokes     jsonb       NOT NULL DEFAULT '[]',
  pixel_count integer     NOT NULL DEFAULT 0,
  creator_ids text[]      DEFAULT '{}',
  last_drawn  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sector_x, sector_y)
);
CREATE INDEX IF NOT EXISTS ws_coord_idx ON world_sectors(sector_x, sector_y);
CREATE INDEX IF NOT EXISTS ws_activity_idx ON world_sectors(last_drawn DESC);

-- World sector bookmarks
CREATE TABLE IF NOT EXISTS world_bookmarks (
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sector_x   integer     NOT NULL,
  sector_y   integer     NOT NULL,
  label      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, sector_x, sector_y)
);

-- ── Creative Missions ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS missions (
  id            text        PRIMARY KEY,
  title         text        NOT NULL,
  description   text        NOT NULL,
  type          text        NOT NULL DEFAULT 'daily' CHECK (type IN ('daily','weekly','permanent')),
  requirement   jsonb       NOT NULL DEFAULT '{}',  -- {action, count}
  xp_reward     integer     NOT NULL DEFAULT 30,
  badge_reward  text
);

INSERT INTO missions (id, title, description, type, requirement, xp_reward) VALUES
  ('draw_5',        'Five Strokes',     'Complete 5 drawings',              'permanent', '{"action":"draw","count":5}',       50),
  ('first_collab',  'Collaborator',     'Draw in a multiplayer room',       'permanent', '{"action":"collab","count":1}',     25),
  ('first_battle',  'Battle Ready',     'Join a Scribble Battle',           'permanent', '{"action":"battle","count":1}',     30),
  ('first_world',   'World Explorer',   'Draw something on the World Canvas','permanent','"{"action":"world","count":1}',     40),
  ('first_challenge','Daily Warrior',   'Complete a daily challenge',       'permanent', '{"action":"challenge","count":1}',  35),
  ('win_battle',    'Battle Champion',  'Win a Scribble Battle',            'permanent', '{"action":"battle_win","count":1}', 75),
  ('social_7',      'Social Butterfly', 'Get 7 followers',                  'permanent', '{"action":"follower","count":7}',   60)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_missions (
  user_id      uuid  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id   text  NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  progress     integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  PRIMARY KEY (user_id, mission_id)
);

-- ── Premium Tiers (foundation) ────────────────────────────────

CREATE TABLE IF NOT EXISTS premium_features (
  feature_key text PRIMARY KEY,
  name        text NOT NULL,
  description text,
  required_tier text NOT NULL DEFAULT 'pro' CHECK (required_tier IN ('pro','studio'))
);

INSERT INTO premium_features VALUES
  ('ai_credits',       'AI Credits',          '100 AI requests per month',           'pro'),
  ('premium_brushes',  'Premium Brushes',     'Exclusive brush effects and textures', 'pro'),
  ('exclusive_themes', 'Exclusive Themes',    'Profile and canvas themes',            'pro'),
  ('unlimited_history','Unlimited History',   'Full drawing undo history',            'pro'),
  ('advanced_export',  'Advanced Export',     'SVG, PDF, and project file export',    'pro'),
  ('studio_collab',    'Studio Collaboration','Private team rooms',                   'studio'),
  ('analytics',        'Creator Analytics',   'Detailed engagement analytics',        'studio')
ON CONFLICT (feature_key) DO NOTHING;

-- ── RLS Policies ──────────────────────────────────────────────

ALTER TABLE xp_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE games             ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_saves     ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_sectors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_bookmarks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions     ENABLE ROW LEVEL SECURITY;

-- XP: own only
CREATE POLICY xp_select  ON xp_events FOR SELECT USING (auth.uid() = user_id);

-- Games: public reads
CREATE POLICY games_select ON games FOR SELECT USING (is_public OR auth.uid() = host_id);
CREATE POLICY games_insert ON games FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY games_update ON games FOR UPDATE USING (auth.uid() = host_id);

-- Game participants: readable by game members
CREATE POLICY gp_select ON game_participants FOR SELECT USING (true);
CREATE POLICY gp_insert ON game_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Challenges: public reads
CREATE POLICY dc_select ON daily_challenges FOR SELECT USING (true);
CREATE POLICY ce_select ON challenge_entries FOR SELECT USING (true);
CREATE POLICY ce_insert ON challenge_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gallery: public drawings readable by all
CREATE POLICY dl_select ON drawing_likes FOR SELECT USING (true);
CREATE POLICY dl_insert ON drawing_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY dl_delete ON drawing_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY dcomment_select ON drawing_comments FOR SELECT USING (true);
CREATE POLICY dcomment_insert ON drawing_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- World canvas: readable by all, writeable by authenticated
CREATE POLICY ws_select ON world_sectors FOR SELECT USING (true);
CREATE POLICY ws_upsert ON world_sectors FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY wb_select ON world_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY wb_all    ON world_bookmarks FOR ALL  USING (auth.uid() = user_id);

-- Missions: own only
CREATE POLICY missions_select ON user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY missions_upsert ON user_missions FOR ALL  USING (auth.uid() = user_id);
