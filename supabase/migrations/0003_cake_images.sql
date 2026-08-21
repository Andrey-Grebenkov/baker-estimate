-- Add image_url column to cakes table (if it does not exist)
ALTER TABLE public.cakes
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- -----------------------------------------------------------------------------
-- Supabase Storage: bucket for cake photos
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('cake-images', 'cake-images', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy "Public cake images can be viewed"
  on storage.objects
  for select
  to public
  using (bucket_id = 'cake-images');

create policy "Authenticated users can insert cake images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'cake-images');

create policy "Authenticated users can update own cake images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'cake-images' and owner = auth.uid())
  with check (bucket_id = 'cake-images');

create policy "Authenticated users can delete own cake images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'cake-images' and owner = auth.uid());
