-- =====================================================================
-- Storage for housemate images (Supabase Storage).
-- Public bucket: anyone can view images; only editors can upload,
-- replace or delete. Images are resized in the editor before upload.
-- Apply once, after 0003: SQL Editor -> paste -> Run.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('housemates', 'housemates', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Editors upload housemate images" on storage.objects for insert to authenticated
  with check (bucket_id = 'housemates' and public.is_editor());
create policy "Editors read housemate image records" on storage.objects for select to authenticated
  using (bucket_id = 'housemates' and public.is_editor());
create policy "Editors replace housemate images" on storage.objects for update to authenticated
  using (bucket_id = 'housemates' and public.is_editor()) with check (bucket_id = 'housemates' and public.is_editor());
create policy "Editors delete housemate images" on storage.objects for delete to authenticated
  using (bucket_id = 'housemates' and public.is_editor());
