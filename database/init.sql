CREATE TABLE IF NOT EXISTS lab_seed (
  id integer PRIMARY KEY,
  name text NOT NULL,
  purpose text NOT NULL
);

INSERT INTO lab_seed (id, name, purpose) VALUES
  (1, 'Acme Corp', 'Primary synthetic tenant'),
  (2, 'Globex', 'Cross-tenant authorization fixture'),
  (3, 'Initech', 'Reserved seed tenant')
ON CONFLICT (id) DO NOTHING;