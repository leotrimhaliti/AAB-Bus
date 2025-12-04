import { BusData } from '@/types/bus';
import { supabase } from './supabase';

interface BusLocationInsert {
    bus_id: string;
    route_id: string | null;
    latitude: string;
    longitude: string;
    heading: string;
    speed: string;
    timestamp: string;
}

interface BusLocationUpdate {
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
    if (!supabase) return;

    try {
        // Check if there are any valid buses to sync
        const validBuses = Object.entries(busData).filter(([_, bus]) => bus.loc_valid === '1');

        if (validBuses.length === 0) {
            return;
        }

        // Fetch existing bus records to determine which to insert/update
        const { data: existingBuses, error: fetchError } = await supabase
            .from('bus_locations')
            .select('id, bus_id') as { data: Array<{ id: string; bus_id: string }> | null; error: unknown };

        if (fetchError || !existingBuses) {
            return;
        }

        const existingBusMap = new Map(
            existingBuses.map(bus => [bus.bus_id, bus.id])
        );

        const toInsert: BusLocationInsert[] = [];
        const toUpdate: Array<{ id: string; data: BusLocationUpdate }> = [];

        // Process each valid bus from the API
        validBuses.forEach(([busId, bus]) => {
            const record: BusLocationInsert = {
                bus_id: busId,
                route_id: null,
                latitude: bus.lat,
                longitude: bus.lng,
                heading: bus.heading || bus.angle || '0',
                speed: bus.speed || '0',
                timestamp: new Date().toISOString(),
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
                    },
                });
            } else {
                // New bus - insert
                toInsert.push(record);
            }
        });

        // Insert new buses
        if (toInsert.length > 0) {
            await supabase
                .from('bus_locations')
                .insert(toInsert as never);
        }

        // Update existing buses
        if (toUpdate.length > 0) {
            for (const { id, data } of toUpdate) {
                await supabase
                    .from('bus_locations')
                    .update(data as never)
                    .eq('id', id);
            }
        }
    } catch {
        // Silent fail - don't affect main bus tracking
    }
}

interface BusLocationRow {
    bus_id: string;
    latitude: string;
    longitude: string;
    heading: string;
    speed: string;
    timestamp: string;
}

/**
 * Get bus locations from Supabase (useful for offline mode)
 */
export async function getBusLocationsFromSupabase(): Promise<BusData | null> {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('bus_locations')
            .select('*')
            .order('timestamp', { ascending: false }) as { data: BusLocationRow[] | null; error: unknown };

        if (error || !data || data.length === 0) {
            return null;
        }

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
    } catch {
        return null;
    }
}
