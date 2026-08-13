-- Allow the Supportable UI to delete requests.
-- The current Requests view is intentionally shared among authenticated users,
-- so deletion follows the same authenticated access boundary as reading.

create policy "authenticated can delete support requests"
on public.support_requests
for delete
to authenticated
using (true);
