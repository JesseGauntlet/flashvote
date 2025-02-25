-- Add missing RLS policy for events table
create policy "Authenticated users can create events"
    on events for insert
    with check (auth.uid() = owner_id);

-- Add missing RLS policies for items, locations, subjects, and admins
create policy "Event owners and admins can manage items"
    on items for all
    using (
        exists (
            select 1 from events
            where events.id = items.event_id
            and (
                events.owner_id = auth.uid()
                or exists (
                    select 1 from admins
                    where admins.event_id = items.event_id
                    and admins.user_id = auth.uid()
                    and admins.role in ('owner', 'editor')
                )
            )
        )
    );

create policy "Event owners and admins can manage locations"
    on locations for all
    using (
        exists (
            select 1 from events
            where events.id = locations.event_id
            and (
                events.owner_id = auth.uid()
                or exists (
                    select 1 from admins
                    where admins.event_id = locations.event_id
                    and admins.user_id = auth.uid()
                    and admins.role in ('owner', 'editor')
                )
            )
        )
    );

create policy "Event owners and admins can manage subjects"
    on subjects for all
    using (
        exists (
            select 1 from events
            where events.id = subjects.event_id
            and (
                events.owner_id = auth.uid()
                or exists (
                    select 1 from admins
                    where admins.event_id = subjects.event_id
                    and admins.user_id = auth.uid()
                    and admins.role in ('owner', 'editor')
                )
            )
        )
    );

create policy "Event owners can manage admins"
    on admins for all
    using (
        exists (
            select 1 from events
            where events.id = admins.event_id
            and events.owner_id = auth.uid()
        )
    ); 