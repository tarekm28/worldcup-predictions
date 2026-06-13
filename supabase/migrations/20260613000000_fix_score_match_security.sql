-- Fix score_match function to use SECURITY DEFINER so it can bypass RLS
-- and properly update predictions when matches are marked as finished.

CREATE OR REPLACE FUNCTION public.score_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL AND OLD.status IS DISTINCT FROM 'finished' THEN
    UPDATE public.predictions p 
    SET points_awarded = CASE 
      WHEN p.home_pred = NEW.home_score AND p.away_pred = NEW.away_score THEN 5 
      WHEN sign((p.home_pred - p.away_pred)::numeric) = sign((NEW.home_score - NEW.away_score)::numeric) THEN 3 
      ELSE 0 
    END 
    WHERE p.match_id = NEW.id;
    
    UPDATE public.profiles pr 
    SET total_points = coalesce((SELECT sum(points_awarded) FROM public.predictions WHERE user_id = pr.id), 0) 
    WHERE pr.id IN (SELECT user_id FROM public.predictions WHERE match_id = NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_match_finished ON public.matches;
CREATE TRIGGER on_match_finished 
  AFTER UPDATE ON public.matches 
  FOR EACH ROW 
  EXECUTE FUNCTION public.score_match();
