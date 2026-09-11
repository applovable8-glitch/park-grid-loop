
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.super_admin_exists() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.super_admin_exists() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.claim_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_super_admin() TO authenticated;
