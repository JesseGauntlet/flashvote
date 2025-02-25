-- Fix missing RLS policies for FlashVote tables

-- Add policy to allow authenticated users to create events
CREATE POLICY "Authenticated users can create events"
    ON public.events FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Add policy to allow event owners and admins to manage items
CREATE POLICY "Event owners and admins can manage items"
    ON public.items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = items.event_id
            AND (
                events.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.admins
                    WHERE admins.event_id = items.event_id
                    AND admins.user_id = auth.uid()
                    AND admins.role IN ('owner', 'editor')
                )
            )
        )
    );

-- Add policy to allow event owners and admins to manage locations
CREATE POLICY "Event owners and admins can manage locations"
    ON public.locations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = locations.event_id
            AND (
                events.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.admins
                    WHERE admins.event_id = locations.event_id
                    AND admins.user_id = auth.uid()
                    AND admins.role IN ('owner', 'editor')
                )
            )
        )
    );

-- Add policy to allow event owners and admins to manage subjects
CREATE POLICY "Event owners and admins can manage subjects"
    ON public.subjects FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = subjects.event_id
            AND (
                events.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.admins
                    WHERE admins.event_id = subjects.event_id
                    AND admins.user_id = auth.uid()
                    AND admins.role IN ('owner', 'editor')
                )
            )
        )
    );

-- Add policy to allow event owners to manage admins
CREATE POLICY "Event owners can manage admins"
    ON public.admins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = admins.event_id
            AND events.owner_id = auth.uid()
        )
    );

-- List all policies after applying changes
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 