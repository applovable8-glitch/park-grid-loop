REVOKE EXECUTE ON FUNCTION public.redeem_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_referral(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.gen_referral_code() FROM PUBLIC, anon;