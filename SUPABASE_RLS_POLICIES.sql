-- Enable RLS on vaults table
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

-- SELECT policy for vaults
CREATE POLICY "vaults_select_policy" ON public.vaults
AS PERMISSIVE FOR SELECT
TO public
USING (auth.uid() = owner_id);

-- INSERT policy for vaults
CREATE POLICY "vaults_insert_policy" ON public.vaults
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() = owner_id);

-- UPDATE policy for vaults
CREATE POLICY "vaults_update_policy" ON public.vaults
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- DELETE policy for vaults
CREATE POLICY "vaults_delete_policy" ON public.vaults
AS PERMISSIVE FOR DELETE
TO public
USING (auth.uid() = owner_id);

-- Enable RLS on notes table
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- SELECT policy for notes
CREATE POLICY "notes_select_policy" ON public.notes
AS PERMISSIVE FOR SELECT
TO public
USING (auth.uid() IN (SELECT owner_id FROM public.vaults WHERE id = vault_id));

-- INSERT policy for notes
CREATE POLICY "notes_insert_policy" ON public.notes
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.vaults WHERE id = vault_id));

-- UPDATE policy for notes
CREATE POLICY "notes_update_policy" ON public.notes
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() IN (SELECT owner_id FROM public.vaults WHERE id = vault_id))
WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.vaults WHERE id = vault_id));

-- DELETE policy for notes
CREATE POLICY "notes_delete_policy" ON public.notes
AS PERMISSIVE FOR DELETE
TO public
USING (auth.uid() IN (SELECT owner_id FROM public.vaults WHERE id = vault_id));