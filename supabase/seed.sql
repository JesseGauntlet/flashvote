-- Insert a test event
insert into events (
    slug,
    title,
    owner_id,
    is_premium,
    metadata
) values (
    'demo',
    'Demo Event',
    '00000000-0000-0000-0000-000000000000', -- This will be replaced with a real user ID once auth is set up
    false,
    '{"description": "A demo event for testing"}'::jsonb
) returning id;

-- Store the event ID for reference
do $$
declare
    v_event_id uuid;
begin
    select id into v_event_id from events where slug = 'demo';

    -- Insert test items
    insert into items (
        event_id,
        item_slug,
        name,
        metadata
    ) values
    (v_event_id, 'item1', 'First Test Item', '{"category": "test"}'::jsonb),
    (v_event_id, 'item2', 'Second Test Item', '{"category": "test"}'::jsonb);

    -- Insert test subjects
    insert into subjects (
        event_id,
        item_id,
        label,
        pos_label,
        neg_label,
        metadata
    ) values
    (
        v_event_id,
        (select id from items where item_slug = 'item1' and event_id = v_event_id),
        'How is this item?',
        'Good',
        'Bad',
        '{"importance": "high"}'::jsonb
    ),
    (
        v_event_id,
        (select id from items where item_slug = 'item2' and event_id = v_event_id),
        'Rate this item',
        'Like',
        'Dislike',
        '{"importance": "medium"}'::jsonb
    ),
    (
        v_event_id,
        null,
        'Overall event rating',
        'Great',
        'Poor',
        '{"importance": "high"}'::jsonb
    );

    -- Insert some test votes
    insert into votes (
        subject_id,
        user_ip,
        choice,
        metadata
    )
    select
        s.id,
        '127.0.0.1',
        random() > 0.5,
        '{"source": "seed"}'::jsonb
    from subjects s
    where s.event_id = v_event_id
    cross join generate_series(1, 5); -- 5 votes per subject

end $$; 