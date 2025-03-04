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
    v_location_id_1 uuid;
    v_location_id_2 uuid;
    v_item_id_1 uuid;
    v_item_id_2 uuid;
    v_subject_id_1 uuid;
    v_subject_id_2 uuid;
    v_subject_id_3 uuid;
begin
    select id into v_event_id from events where slug = 'demo';

    -- Insert test locations for location-based voting
    insert into locations (
        event_id,
        name,
        address,
        city,
        zip_code,
        lat,
        lon,
        metadata
    ) values
    (v_event_id, 'Seattle Store', '123 Pike St', 'Seattle', '98101', 47.6062, -122.3321, '{"store_number": "SEA001", "region": "northwest"}'::jsonb),
    (v_event_id, 'Portland Store', '456 Rose St', 'Portland', '97205', 45.5231, -122.6765, '{"store_number": "PDX001", "region": "northwest"}'::jsonb)
    returning id into v_location_id_1;
    
    -- Get the second location ID
    select id into v_location_id_2 from locations where name = 'Portland Store' and event_id = v_event_id;

    -- Insert test items with category
    insert into items (
        event_id,
        item_slug,
        name,
        category,
        metadata
    ) values
    (v_event_id, 'item1', 'First Test Item', 'Produce', '{"description": "This is the first test item"}'::jsonb),
    (v_event_id, 'item2', 'Second Test Item', 'Electronics', '{"description": "This is the second test item"}'::jsonb)
    returning id into v_item_id_1;
    
    -- Get the second item ID
    select id into v_item_id_2 from items where item_slug = 'item2' and event_id = v_event_id;

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
        v_item_id_1,
        'How is this item?',
        'Good',
        'Bad',
        '{"importance": "high"}'::jsonb
    ),
    (
        v_event_id,
        v_item_id_2,
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
    )
    returning id into v_subject_id_1;
    
    -- Get the other subject IDs
    select id into v_subject_id_2 from subjects where label = 'Rate this item' and event_id = v_event_id;
    select id into v_subject_id_3 from subjects where label = 'Overall event rating' and event_id = v_event_id;

    -- Insert some test votes with location_id
    -- Subject 1 votes (Seattle location)
    insert into votes (
        subject_id,
        user_ip,
        choice,
        location_id,
        metadata
    )
    select
        v_subject_id_1,
        '127.0.0.' || generate_series,
        (random() > 0.5),
        v_location_id_1,
        '{"source": "seed", "device": "desktop"}'::jsonb
    from generate_series(1, 10);

    -- Subject 1 votes (Portland location)
    insert into votes (
        subject_id,
        user_ip,
        choice,
        location_id,
        metadata
    )
    select
        v_subject_id_1,
        '127.0.1.' || generate_series,
        (random() > 0.5),
        v_location_id_2,
        '{"source": "seed", "device": "mobile"}'::jsonb
    from generate_series(1, 8);

    -- Subject 2 votes (mixed locations)
    insert into votes (
        subject_id,
        user_ip,
        choice,
        location_id,
        metadata
    )
    select
        v_subject_id_2,
        '127.0.2.' || generate_series,
        (random() > 0.5),
        CASE WHEN generate_series % 2 = 0 THEN v_location_id_1 ELSE v_location_id_2 END,
        '{"source": "seed"}'::jsonb
    from generate_series(1, 15);

    -- Subject 3 votes (overall event - some with location, some without)
    insert into votes (
        subject_id,
        user_ip,
        choice,
        location_id,
        metadata
    )
    select
        v_subject_id_3,
        '127.0.3.' || generate_series,
        (random() > 0.5),
        CASE WHEN generate_series % 3 = 0 THEN v_location_id_1 
             WHEN generate_series % 3 = 1 THEN v_location_id_2
             ELSE NULL END,
        '{"source": "seed"}'::jsonb
    from generate_series(1, 12);

    -- Insert some votes from "authenticated" users
    insert into votes (
        subject_id,
        user_id,
        choice,
        location_id,
        metadata
    )
    values
    (v_subject_id_1, '00000000-0000-0000-0000-000000000000', true, v_location_id_1, '{"source": "seed", "premium": true}'::jsonb),
    (v_subject_id_2, '00000000-0000-0000-0000-000000000000', false, v_location_id_2, '{"source": "seed", "premium": true}'::jsonb),
    (v_subject_id_3, '00000000-0000-0000-0000-000000000000', true, NULL, '{"source": "seed", "premium": true}'::jsonb);
    
    -- Insert votes with geographic data (lat/lon)
    insert into votes (
        subject_id,
        user_ip,
        lat,
        lon,
        choice,
        location_id,
        metadata
    )
    values
    (v_subject_id_1, '192.168.1.1', 47.6062, -122.3321, true, v_location_id_1, '{"source": "seed", "geo_accurate": true}'::jsonb),
    (v_subject_id_2, '192.168.1.2', 45.5231, -122.6765, false, v_location_id_2, '{"source": "seed", "geo_accurate": true}'::jsonb);

    -- Output success message
    raise notice 'Seed data created successfully!';
    raise notice 'Event ID: %', v_event_id;
    raise notice 'Location IDs: % (Seattle), % (Portland)', v_location_id_1, v_location_id_2;
    raise notice 'Item IDs: % (item1), % (item2)', v_item_id_1, v_item_id_2;
    raise notice 'Subject IDs: %, %, %', v_subject_id_1, v_subject_id_2, v_subject_id_3;

end $$; 