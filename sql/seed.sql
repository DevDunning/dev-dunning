INSERT INTO poll_options (text, votes) VALUES ('Yes', 0), ('No', 0), ('Maybe', 0);

INSERT INTO news (title, body, link) VALUES 
('Launch Announcement', '$DD token launched on Pump.fun!', 'https://pump.fun'),
('Update 1', 'New features added.', null);

INSERT INTO roadmap_phases (phase_name, milestones, progress, completed) VALUES 
('Phase 1: Launch', 'Token creation\nInitial marketing', 100, true),
('Phase 2: Growth', 'Partnerships\nExchange listing', 50, false),
('Phase 3: Expansion', 'DAO setup\nUtility additions', 0, false);

INSERT INTO token_cache (id, data) VALUES (1, '{}') ON CONFLICT (id) DO NOTHING;