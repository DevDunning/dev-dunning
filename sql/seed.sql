-- sql/seed.sql

-- Insert default poll choices
INSERT INTO poll_choices (choice_text) VALUES
('Yes'), ('No'), ('Maybe');

-- Insert default roadmap phases
INSERT INTO roadmap_phases (title, description, progress) VALUES
('Phase 1: Concept & Planning', 'Define project goals and roadmap.', 100),
('Phase 2: Development & Testing', 'Develop smart contracts and testnet launch.', 50),
('Phase 3: Mainnet Launch & Marketing', 'Official launch and marketing campaigns.', 10);

-- Insert initial token cache row
INSERT INTO token_cache (id, price, market_cap, total_supply, holders, trades) VALUES
(1, '$0', '$0', '0', 0, 0);
