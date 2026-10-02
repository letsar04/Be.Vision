-- Ensure authenticated users can evaluate tenant membership RLS policies.
-- Required by tenants/sites policies that call public.is_tenant_member(uuid).
grant execute on function public.is_tenant_member(uuid) to authenticated;
