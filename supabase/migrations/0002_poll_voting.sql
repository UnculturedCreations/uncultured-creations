-- =====================================================================
-- Reality Reloaded: poll voting
-- record_vote() is the only way a vote enters the database. It can be
-- called solely with the secret key, i.e. by the cast-vote Edge Function
-- after it has verified the visitor with Cloudflare Turnstile.
-- Apply once, after 0001: SQL Editor -> paste -> Run.
-- =====================================================================

create or replace function public.record_vote(p_poll_id uuid, p_option_id uuid, p_device_id text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_poll   public.polls%rowtype;
  v_hash   text;
  v_status text := 'ok';
begin
  -- A device id is a random value generated in the visitor's browser.
  if p_device_id is null or p_device_id !~ '^[A-Za-z0-9-]{16,64}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into v_poll from public.polls where id = p_poll_id;
  if not found or v_poll.status <> 'open' or (v_poll.closes_at is not null and v_poll.closes_at <= now()) then
    return jsonb_build_object('status', 'closed');
  end if;

  if not exists (select 1 from public.poll_options where id = p_option_id and poll_id = p_poll_id) then
    return jsonb_build_object('status', 'invalid');
  end if;

  -- Only a one-way hash of poll + device is stored, never the raw device id.
  v_hash := encode(sha256(convert_to(p_poll_id::text || ':' || p_device_id, 'UTF8')), 'hex');

  begin
    insert into public.poll_votes (poll_id, option_id, voter_hash) values (p_poll_id, p_option_id, v_hash);
  exception when unique_violation then
    v_status := 'already_voted';
  end;

  return jsonb_build_object(
    'status', v_status,
    'results', coalesce((
      select jsonb_agg(jsonb_build_object('option_id', o.id, 'votes', (select count(*) from public.poll_votes v where v.option_id = o.id)) order by o.sort_order)
      from public.poll_options o where o.poll_id = p_poll_id
    ), '[]'::jsonb)
  );
end $$;

revoke execute on function public.record_vote(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.record_vote(uuid, uuid, text) to service_role;
