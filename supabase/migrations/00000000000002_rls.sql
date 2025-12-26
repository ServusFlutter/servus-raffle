-- Servus Raffle - Row Level Security Policies
-- All tables MUST have RLS enabled

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================
-- RAFFLES POLICIES
-- ============================================

-- Anyone can view active raffles (public)
CREATE POLICY "Public can view active raffles"
  ON public.raffles FOR SELECT
  USING (status = 'active' OR status = 'drawing');

-- Authenticated users can view raffles they created
CREATE POLICY "Users can view own raffles"
  ON public.raffles FOR SELECT
  USING (auth.uid() = created_by);

-- Admins can do everything with raffles
CREATE POLICY "Admins have full access to raffles"
  ON public.raffles FOR ALL
  USING (public.is_admin(auth.uid()));

-- ============================================
-- PARTICIPANTS POLICIES
-- ============================================

-- Users can view their own participation
CREATE POLICY "Users can view own participation"
  ON public.participants FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can view participant counts for active raffles (for display)
CREATE POLICY "Public can view active raffle participants"
  ON public.participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles
      WHERE raffles.id = participants.raffle_id
      AND (raffles.status = 'active' OR raffles.status = 'drawing')
    )
  );

-- Authenticated users can join active raffles
CREATE POLICY "Users can join active raffles"
  ON public.participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.raffles
      WHERE raffles.id = raffle_id
      AND raffles.status = 'active'
    )
  );

-- Admins can manage participants
CREATE POLICY "Admins can manage participants"
  ON public.participants FOR ALL
  USING (public.is_admin(auth.uid()));

-- ============================================
-- PRIZES POLICIES
-- ============================================

-- Anyone can view prizes for active raffles
CREATE POLICY "Public can view active raffle prizes"
  ON public.prizes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles
      WHERE raffles.id = prizes.raffle_id
      AND (raffles.status = 'active' OR raffles.status = 'drawing' OR raffles.status = 'completed')
    )
  );

-- Admins can manage prizes
CREATE POLICY "Admins can manage prizes"
  ON public.prizes FOR ALL
  USING (public.is_admin(auth.uid()));

-- ============================================
-- WINNERS POLICIES
-- ============================================

-- Anyone can view winners for completed raffles
CREATE POLICY "Public can view winners"
  ON public.winners FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles
      WHERE raffles.id = winners.raffle_id
      AND (raffles.status = 'drawing' OR raffles.status = 'completed')
    )
  );

-- Admins can manage winners
CREATE POLICY "Admins can manage winners"
  ON public.winners FOR ALL
  USING (public.is_admin(auth.uid()));
