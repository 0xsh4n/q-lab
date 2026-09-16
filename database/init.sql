-- TechDesk AI — deterministic synthetic seed boundary.
-- The running application uses in-memory fixtures; this table documents the
-- multi-tenant model and gives the postgres service something to serve.

CREATE TABLE IF NOT EXISTS tenants (
  id integer PRIMARY KEY,
  slug text NOT NULL,
  name text NOT NULL,
  plan text NOT NULL,
  purpose text NOT NULL
);

INSERT INTO tenants (id, slug, name, plan, purpose) VALUES
  (1, 'northwind', 'Northwind Trading', 'Enterprise', 'Primary synthetic tenant'),
  (2, 'meridian',  'Meridian Health',   'Growth',     'Cross-tenant isolation fixture (synthetic PII)'),
  (3, 'vertex',    'Vertex Logistics',  'Starter',    'Third tenant for isolation testing')
ON CONFLICT (id) DO NOTHING;
