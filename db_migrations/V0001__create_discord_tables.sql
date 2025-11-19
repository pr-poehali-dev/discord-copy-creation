-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'online',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servers table
CREATE TABLE IF NOT EXISTS servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_url TEXT,
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Server members table
CREATE TABLE IF NOT EXISTS server_members (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id),
    user_id INTEGER REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, user_id)
);

-- Insert demo server and channels
INSERT INTO servers (name, icon_url, owner_id) VALUES 
('Главный сервер', '🚀', NULL);

INSERT INTO channels (server_id, name, type) VALUES 
(1, 'общий', 'text'),
(1, 'случайное', 'text'),
(1, 'мемы', 'text');