import { supabase } from './supabase';
import { BusData } from '@/types/bus';

interface BusLocationRecord {
  id?: string;
  bus_id: string;
  route_id?: string | null;
  latitude: string;
  longitude: string;
  heading: string;
  speed: string;
  timestamp: string;
}

/**
 * Sync bus locations to Supabase
 * - Inserts new buses
 * - Updates existing buses with new coordinates
 * - Only syncs when buses are available
 */
export async function syncBusLocationsToSupabase(busData: BusData): Promise<void> {
  try {
    // Check if there are any valid buses to sync
    const validBuses = Object.entries(busData).filter(([_, bus]) => bus.loc_valid === '1');
    
    if (validBuses.length === 0) {
      return;
    }

    // Get current session to set updated_by (optional since we use Faculty API auth)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Fetch existing bus records to determine which to insert/update
    const { data: existingBuses, error: fetchError } = await supabase
      .from('bus_locations')
      .select('id, bus_id');

    if (fetchError) {
      console.error('Error fetching existing buses:', fetchError);
      return;
    }

    const existingBusMap = new Map(
      (existingBuses || []).map(bus => [bus.bus_id, bus.id])
    );

    const toInsert: any[] = [];
    const toUpdate: Array<{ id: string; data: any }> = [];

    // Process each valid bus from the API
    validBuses.forEach(([busId, bus]) => {
      const record = {
        bus_id: busId,
        route_id: null,
        latitude: bus.lat,
        longitude: bus.lng,
        heading: bus.heading || bus.angle || '0',
        speed: bus.speed || '0',
        timestamp: new Date().toISOString(),
        ...(userId && { updated_by: userId }),
      };

      const existingId = existingBusMap.get(busId);

      if (existingId) {
        // Bus exists - update coordinates
        toUpdate.push({
          id: existingId,
          data: {
            latitude: record.latitude,
            longitude: record.longitude,
            heading: record.heading,
            speed: record.speed,
            timestamp: record.timestamp,
            ...(userId && { updated_by: userId }),
          },
        });
      } else {
        // New bus - insert
        toInsert.push(record);
      }
    });

    // Insert new buses
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('bus_locations')
        .insert(toInsert);

      if (insertError) {
        console.error('Error inserting buses:', insertError);
      } else {
        console.log(`✅ Inserted ${toInsert.length} new bus(es)`);
      }
    }

    // Update existing buses
    if (toUpdate.length > 0) {
      for (const { id, data } of toUpdate) {
        const { error: updateError } = await supabase
          .from('bus_locations')
          .update(data)
          .eq('id', id);

        if (updateError) {
          console.error(`Error updating bus ${id}:`, updateError);
        }
      }
      console.log(`✅ Updated ${toUpdate.length} bus(es)`);
    }
  } catch (error) {
    console.error('Error syncing buses to Supabase:', error);
  }
}

/**
 * Get bus locations from Supabase (useful for offline mode)
 */
export async function getBusLocationsFromSupabase(): Promise<BusData | null> {
  try {
    const { data, error } = await supabase
      .from('bus_locations')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching from Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    // Convert Supabase format to BusData format
    const busData: BusData = {};
    data.forEach((record) => {
      busData[record.bus_id] = {
        lat: record.latitude,
        lng: record.longitude,
        heading: record.heading,
        speed: record.speed,
        loc_valid: '1',
        timestamp: new Date(record.timestamp).getTime(),
      };
    });

    return busData;
  } catch (error) {
    console.error('Error getting buses from Supabase:', error);
    return null;
  }
}
