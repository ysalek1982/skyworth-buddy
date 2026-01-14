-- Update the admin trigger to use hincha@skyworth.bo instead of hincha@skyworth.com
CREATE OR REPLACE FUNCTION public.handle_admin_user_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-assign admin role for the specific admin email
  IF NEW.email = 'hincha@skyworth.bo' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;