-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Create tables
create table if not exists profiles (
    id uuid references auth.users on delete cascade primary key,
    name text,
    email text,
    is_premium boolean default false,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists events (
    id uuid default uuid_generate_v4() primary key,
    owner_id uuid references auth.users not null,
    slug text not null unique,
    title text not null,
    is_premium boolean default false,
    archived_at timestamp with time zone,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists items (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references events on delete cascade not null,
    item_slug text not null,
    name text not null,
    item_id text,
    category text,
    image_url text,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(event_id, item_slug)
);

create table if not exists locations (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references events on delete cascade not null,
    name text not null,
    address text,
    city text,
    zip_code text,
    lat float,
    lon float,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists subjects (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references events on delete cascade not null,
    item_id uuid references items on delete cascade,
    label text not null,
    pos_label text not null,
    neg_label text not null,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists votes (
    id uuid default uuid_generate_v4() primary key,
    subject_id uuid references subjects on delete cascade not null,
    user_id uuid references auth.users on delete set null,
    user_ip text,
    lat float,
    lon float,
    choice boolean not null,
    location_id uuid references locations on delete set null,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists admins (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references events on delete cascade not null,
    user_id uuid references auth.users on delete cascade not null,
    role text not null,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(event_id, user_id)
);

-- Create indexes for better query performance
create index if not exists events_owner_id_idx on events(owner_id);
create index if not exists items_event_id_idx on items(event_id);
create index if not exists locations_event_id_idx on locations(event_id);
create index if not exists subjects_event_id_idx on subjects(event_id);
create index if not exists subjects_item_id_idx on subjects(item_id);
create index if not exists votes_subject_id_idx on votes(subject_id);
create index if not exists votes_location_id_idx on votes(location_id);
create index if not exists votes_created_at_idx on votes(created_at);
create index if not exists admins_event_id_idx on admins(event_id);
create index if not exists admins_user_id_idx on admins(user_id);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table events enable row level security;
alter table items enable row level security;
alter table locations enable row level security;
alter table subjects enable row level security;
alter table votes enable row level security;
alter table admins enable row level security;

-- Create policies
-- Profiles: Users can read their own profile
create policy "Users can read own profile"
    on profiles for select
    using (auth.uid() = id);

-- Events: Anyone can read non-archived events
create policy "Anyone can read non-archived events"
    on events for select
    using (archived_at is null);

-- Events: Owners can update their events
create policy "Owners can update their events"
    on events for update
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);

-- Events: Authenticated users can create events
create policy "Authenticated users can create events"
    on events for insert
    with check (auth.uid() = owner_id);

-- Items: Anyone can read items of non-archived events
create policy "Anyone can read items"
    on items for select
    using (
        exists (
            select 1 from events
            where events.id = items.event_id
            and events.archived_at is null
        )
    );

-- Items: Event owners and admins can create/update/delete items
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

-- Locations: Anyone can read locations
create policy "Anyone can read locations"
    on locations for select
    using (true);

-- Locations: Event owners and admins can manage locations
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

-- Subjects: Anyone can read subjects
create policy "Anyone can read subjects"
    on subjects for select
    using (true);

-- Subjects: Event owners and admins can manage subjects
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

-- Votes: Anyone can create votes (rate limiting handled in application)
create policy "Anyone can create votes"
    on votes for insert
    with check (true);

-- Votes: Anyone can read vote counts
create policy "Anyone can read votes"
    on votes for select
    using (true);

-- Admins: Admins can read their own roles
create policy "Admins can read own roles"
    on admins for select
    using (auth.uid() = user_id);

-- Admins: Event owners can manage admins
create policy "Event owners can manage admins"
    on admins for all
    using (
        exists (
            select 1 from events
            where events.id = admins.event_id
            and events.owner_id = auth.uid()
        )
    );

-- Create triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
    before update on profiles
    for each row
    execute function update_updated_at_column();

create trigger update_events_updated_at
    before update on events
    for each row
    execute function update_updated_at_column();

create trigger update_items_updated_at
    before update on items
    for each row
    execute function update_updated_at_column();

create trigger update_locations_updated_at
    before update on locations
    for each row
    execute function update_updated_at_column();

-- Auto-create profile on user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, is_premium, email, metadata)
  values (new.id, false, new.email, '{}');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();