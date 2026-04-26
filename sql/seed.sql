-- legal-ai seed variables 
INSERT INTO users (id, email, hashed_password, name, is_active)
VALUES 
('admin-uuid-1', 'admin@legalai.com', '$2b$12$xG12x3.tW./1gqL.XyVnOuI0eXjP8EwE/W7eXjP8EwE/W7eXjP8Ew', 'Adminstrator', true),
('user-uuid-2', 'user@legalai.com', '$2b$12$xG12x3.tW./1gqL.XyVnOuI0eXjP8EwE/W7eXjP8EwE/W7eXjP8Ew', 'Standard User', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('admin-uuid-1', 'admin') ON CONFLICT DO NOTHING;
