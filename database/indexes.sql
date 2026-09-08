-- Spatial GiST Indexes for fast ST_DWithin and ST_Intersects queries
CREATE INDEX IF NOT EXISTS idx_pois_geometry ON pois USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_streetlights_geometry ON streetlights USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_network_coverage_geometry ON network_coverage USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_transit_stops_geometry ON transit_stops USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_routes_geometry ON routes USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_route_segments_geometry ON route_segments USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_observations_geometry ON observations USING GIST (geometry);

-- B-Tree indexes for foreign keys and frequent lookups
CREATE INDEX IF NOT EXISTS idx_pois_type ON pois (type);
CREATE INDEX IF NOT EXISTS idx_transit_services_stop ON transit_services (stop_id);
CREATE INDEX IF NOT EXISTS idx_route_segments_route ON route_segments (route_id);
