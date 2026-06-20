-- Add 'unlocked' flag to matches so admins can allow edits after kickoff
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS unlocked boolean DEFAULT false;

-- Ensure profiles has an is_admin flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Allow admins to update matches (so they can toggle unlocked)
DROP POLICY IF EXISTS "matches admin unlock" ON public.matches;
CREATE POLICY "matches admin unlock" ON public.matches
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Replace predictions insert/update policies to allow edits when match.unlocked = true
DROP POLICY IF EXISTS "predictions insert before kickoff" ON public.predictions;
CREATE POLICY "predictions insert before kickoff" ON public.predictions
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid())
    AND (
      now() < (SELECT m.kickoff_time FROM public.matches m WHERE m.id = predictions.match_id)
      OR EXISTS (SELECT 1 FROM public.matches m WHERE m.id = predictions.match_id AND m.unlocked = true)
    )
  );

DROP POLICY IF EXISTS "predictions update before kickoff" ON public.predictions;
CREATE POLICY "predictions update before kickoff" ON public.predictions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    (user_id = auth.uid())
    AND (
      now() < (SELECT m.kickoff_time FROM public.matches m WHERE m.id = predictions.match_id)
      OR EXISTS (SELECT 1 FROM public.matches m WHERE m.id = predictions.match_id AND m.unlocked = true)
    )
  );
