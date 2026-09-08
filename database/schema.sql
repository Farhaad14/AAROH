-- Enable PostGIS spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. route_requests
CREATE TABLE IF NOT EXISTS route_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    destination_lat DOUBLE PRECISION NOT NULL,
    destination_lng DOUBLE PRECISION NOT NULL,
    travel_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. routes
CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(36) REFERENCES route_requests(id) ON DELETE CASCADE,
    route_name VARCHAR(255) NOT NULL,
    geometry GEOMETRY(LineString, 4326) NOT NULL,
    distance_m DOUBLE PRECISION NOT NULL,
    duration_seconds DOUBLE PRECISION NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. route_segments
CREATE TABLE IF NOT EXISTS route_segments (
    id VARCHAR(36) PRIMARY KEY,
    route_id VARCHAR(36) REFERENCES routes(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    geometry GEOMETRY(LineString, 4326) NOT NULL,
    length_m DOUBLE PRECISION NOT NULL,
    
    activity_score DOUBLE PRECISION DEFAULT 0.0,
    business_score DOUBLE PRECISION DEFAULT 0.0,
    emergency_score DOUBLE PRECISION DEFAULT 0.0,
    time_score DOUBLE PRECISION DEFAULT 0.0,
    isolation_score DOUBLE PRECISION DEFAULT 0.0,
    surveillance_score DOUBLE PRECISION DEFAULT 0.0,
    network_score DOUBLE PRECISION DEFAULT 0.0,
    transit_score DOUBLE PRECISION DEFAULT 0.0,
    lighting_score DOUBLE PRECISION DEFAULT 0.0,
    
    segment_score DOUBLE PRECISION DEFAULT 0.0,
    confidence VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. pois
CREATE TABLE IF NOT EXISTS pois (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    geometry GEOMETRY(Point, 4326) NOT NULL,
    opening_hours VARCHAR(255),
    source VARCHAR(50) DEFAULT 'osm',
    source_id VARCHAR(100),
    confidence VARCHAR(20) DEFAULT 'HIGH',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. streetlights
CREATE TABLE IF NOT EXISTS streetlights (
    id VARCHAR(36) PRIMARY KEY,
    geometry GEOMETRY(Point, 4326) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'working',
    source VARCHAR(50) DEFAULT 'municipal',
    confidence VARCHAR(20) DEFAULT 'MEDIUM',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. network_coverage
CREATE TABLE IF NOT EXISTS network_coverage (
    id VARCHAR(36) PRIMARY KEY,
    operator VARCHAR(50) NOT NULL,
    technology VARCHAR(20) NOT NULL,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    signal_level VARCHAR(20) NOT NULL DEFAULT 'STRONG',
    source VARCHAR(50) DEFAULT 'trai',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. transit_stops
CREATE TABLE IF NOT EXISTS transit_stops (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- bus, metro, railway
    geometry GEOMETRY(Point, 4326) NOT NULL,
    operator VARCHAR(100),
    source VARCHAR(50) DEFAULT 'gtfs'
);

-- 9. transit_services
CREATE TABLE IF NOT EXISTS transit_services (
    id VARCHAR(36) PRIMARY KEY,
    stop_id VARCHAR(36) REFERENCES transit_stops(id) ON DELETE CASCADE,
    route_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    frequency_minutes INTEGER NOT NULL,
    source VARCHAR(50) DEFAULT 'gtfs'
);

-- 10. observations
CREATE TABLE IF NOT EXISTS observations (
    id VARCHAR(36) PRIMARY KEY,
    segment_id VARCHAR(36) REFERENCES route_segments(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    value VARCHAR(50) NOT NULL,
    geometry GEOMETRY(Point, 4326),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confidence VARCHAR(20) DEFAULT 'MEDIUM',
    source VARCHAR(50) DEFAULT 'user'
);

-- 11. route_scores
CREATE TABLE IF NOT EXISTS route_scores (
    id VARCHAR(36) PRIMARY KEY,
    route_id VARCHAR(36) REFERENCES routes(id) ON DELETE CASCADE,
    activity_score DOUBLE PRECISION NOT NULL,
    business_score DOUBLE PRECISION NOT NULL,
    emergency_score DOUBLE PRECISION NOT NULL,
    time_score DOUBLE PRECISION NOT NULL,
    isolation_score DOUBLE PRECISION NOT NULL,
    surveillance_score DOUBLE PRECISION NOT NULL,
    network_score DOUBLE PRECISION NOT NULL,
    transit_score DOUBLE PRECISION NOT NULL,
    lighting_score DOUBLE PRECISION NOT NULL,
    average_segment_score DOUBLE PRECISION NOT NULL,
    weakest_segment_score DOUBLE PRECISION NOT NULL,
    final_score DOUBLE PRECISION NOT NULL,
    confidence VARCHAR(20) NOT NULL
);

-- 12. ai_explanations
CREATE TABLE IF NOT EXISTS ai_explanations (
    id VARCHAR(36) PRIMARY KEY,
    route_id VARCHAR(36) REFERENCES routes(id) ON DELETE CASCADE,
    prompt_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    explanation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
