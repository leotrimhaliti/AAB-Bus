# Quick Setup: Bus Location Sync

## 🚀 3 Steps to Start Syncing

### 1️⃣ Create the Database Table

Go to your Supabase dashboard → SQL Editor and run:

```sql
-- Create bus_locations table
CREATE TABLE IF NOT EXISTS bus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id TEXT NOT NULL UNIQUE,
  route_id UUID,
  latitude TEXT NOT NULL,
  longitude TEXT NOT NULL,
  heading TEXT DEFAULT '0',
  speed TEXT DEFAULT '0',
  updated_by UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bus_locations_bus_id ON bus_locations(bus_id);
CREATE INDEX idx_bus_locations_timestamp ON bus_locations(timestamp DESC);

ALTER TABLE bus_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read bus locations"
  ON bus_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert bus locations"
  ON bus_locations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update bus locations"
  ON bus_locations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

### 2️⃣ That's It!

The app is already configured to sync automatically. Every 10 seconds:
- New buses → **Inserted** into database
- Existing buses → **Updated** with new coordinates

### 3️⃣ Verify It's Working

In Supabase Table Editor, check `bus_locations` table:
- You should see bus records appearing
- `timestamp` updates every 10 seconds
- `latitude` and `longitude` change as buses move

## 📊 View Your Data

```sql
-- See all buses with latest locations
SELECT bus_id, latitude, longitude, heading, speed, timestamp
FROM bus_locations
ORDER BY timestamp DESC;
```

## ✅ Done!

Your bus data is now being saved to Supabase automatically! 🎉
