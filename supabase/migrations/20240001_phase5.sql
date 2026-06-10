-- ============================================================
-- Point Club — Phase 5 Database Migration
-- Social Platform: Friends, Followers, Notifications,
-- Room Chat, Voice Sessions, Presence, Achievements
-- ============================================================

-- ── Extend profiles table ────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS banner_url        text,
  ADD COLUMN IF NOT EXISTS bio               text,
  ADD COLUMN IF NOT EXISTS drawing_interests text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_links      jsonb         DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS privacy_settings  jsonb         DEFAULT '{"who_can_add":"everyone","who_can_invite":"friends","profile_visibility":"public","activity_visibility":"public"}',
  ADD COLUMN IF NOT EXISTS total_drawings    integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rooms_created     integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follower_count    integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count   integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS friend_count      integer       DEFAULT 0;

-- ── Friends ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS friends (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'pending'  -- pending | accepted | rejected | blocked
                CHECK (status IN ('pending','accepted','rejected','blocked')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS friends_requester_idx  ON friends(requester_id);
CREATE INDEX IF NOT EXISTS friends_addressee_idx  ON friends(addressee_id);
CREATE INDEX IF NOT EXISTS friends_status_idx     ON friends(status);

-- ── Followers ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS followers (
  follower_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS followers_following_idx ON followers(following_id);

-- Trigger: keep follower_count / following_count in sync
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET follower_count  = GREATEST(follower_count  - 1, 0) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS followers_count_trigger ON followers;
CREATE TRIGGER followers_count_trigger
AFTER INSERT OR DELETE ON followers
FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- ── Notifications ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text        NOT NULL,   -- friend_request | friend_accepted | room_invite | mention | follow | achievement | system
  title       text        NOT NULL,
  message     text,
  data        jsonb       DEFAULT '{}',
  is_read     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_unread_idx  ON notifications(user_id, is_read) WHERE is_read = false;

-- ── Room Messages ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS room_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     text        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  username    text        NOT NULL DEFAULT 'Anonymous',
  content     text        NOT NULL CHECK (char_length(content) <= 2000),
  mentions    jsonb       DEFAULT '[]',
  reactions   jsonb       DEFAULT '{}',
  is_pinned   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS room_messages_room_idx ON room_messages(room_id, created_at);

-- ── Voice Sessions ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS voice_sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     text        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  left_at     timestamptz,
  duration_s  integer
);

CREATE INDEX IF NOT EXISTS voice_sessions_room_idx ON voice_sessions(room_id);
CREATE INDEX IF NOT EXISTS voice_sessions_user_idx ON voice_sessions(user_id);

-- ── User Presence ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_presence (
  user_id         uuid        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'offline'  -- online | away | drawing | in_room | offline
                  CHECK (status IN ('online','away','drawing','in_room','offline')),
  current_room_id text        REFERENCES rooms(id) ON DELETE SET NULL,
  last_seen       timestamptz NOT NULL DEFAULT now()
);

-- ── Achievements catalog ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS achievements (
  id          text        PRIMARY KEY,
  title       text        NOT NULL,
  description text        NOT NULL,
  icon        text        NOT NULL DEFAULT '🏅',
  points      integer     NOT NULL DEFAULT 10
);

INSERT INTO achievements (id, title, description, icon, points) VALUES
  ('first_drawing',  'First Stroke',       'Created your first drawing',       '✏️', 10),
  ('first_friend',   'New Friend',         'Added your first friend',           '🤝', 10),
  ('first_room',     'Room Creator',       'Created your first room',           '🚪', 20),
  ('10_drawings',    'Sketch Artist',      'Created 10 drawings',              '🎨', 25),
  ('100_drawings',   'Creative Master',    'Created 100 drawings',             '🏆', 100),
  ('collaborator',   'Collaborator',       'Drew with 5 different people',     '👥', 30),
  ('early_adopter',  'Early Adopter',      'Joined during the beta phase',     '⭐', 50),
  ('community_fav',  'Community Favorite', 'Gained 100 followers',             '💜', 75)
ON CONFLICT (id) DO NOTHING;

-- ── User Achievements ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id  text        NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS user_achievements_user_idx ON user_achievements(user_id);

-- ── User Badges (display subset) ──────────────────────────────

CREATE TABLE IF NOT EXISTS user_badges (
  user_id    uuid   NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type text   NOT NULL,  -- artist | builder | collaborator | mentor | early_adopter
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_type)
);

-- ── Matchmaking Queue ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mode        text        NOT NULL DEFAULT 'casual',
  language    text,
  region      text,
  interests   text[]      DEFAULT '{}',
  joined_at   timestamptz NOT NULL DEFAULT now(),
  matched_at  timestamptz,
  room_id     text        REFERENCES rooms(id) ON DELETE SET NULL,
  UNIQUE (user_id)
);

-- ── Reports (moderation) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id    text        NOT NULL,
  target_type  text        NOT NULL CHECK (target_type IN ('user','room','drawing','message')),
  reason       text        NOT NULL,
  status       text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Direct Messages (foundation — Phase 6 UI) ─────────────────

CREATE TABLE IF NOT EXISTS direct_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      text        NOT NULL CHECK (char_length(content) <= 5000),
  is_read      boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_sender_idx    ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS dm_recipient_idx ON direct_messages(recipient_id, is_read);

-- ── Row Level Security ─────────────────────────────────────────

ALTER TABLE friends           ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages   ENABLE ROW LEVEL SECURITY;

-- Friends: users see their own records
CREATE POLICY friends_select ON friends FOR SELECT USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);
CREATE POLICY friends_insert ON friends FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY friends_update ON friends FOR UPDATE USING (auth.uid() = addressee_id);
CREATE POLICY friends_delete ON friends FOR DELETE USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);

-- Followers: public reads, own writes
CREATE POLICY followers_select ON followers FOR SELECT USING (true);
CREATE POLICY followers_insert ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY followers_delete ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Notifications: own only
CREATE POLICY notif_select ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notif_update ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY notif_delete ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Room messages: readable by all authenticated, insert own
CREATE POLICY rm_select ON room_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY rm_insert ON room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Presence: public reads, own writes
CREATE POLICY presence_select ON user_presence FOR SELECT USING (true);
CREATE POLICY presence_upsert ON user_presence FOR ALL USING (auth.uid() = user_id);

-- Achievements: public reads
CREATE POLICY ach_select ON user_achievements FOR SELECT USING (true);

-- DMs: participants only
CREATE POLICY dm_select ON direct_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY dm_insert ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
