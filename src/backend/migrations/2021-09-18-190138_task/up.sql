CREATE TABLE clients (
    id INTEGER NOT NULL,
    alias TEXT NOT NULL,
    public_certificate TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE drops (
    id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    encrypted_key TEXT NOT NULL,
    cryptogram_id INTEGER NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE cryptograms (
  id INTEGER NOT NULL,
  encrypted_text TEXT NOT NULL,
  created_date DATE NOT NULL,
  expiration_date DATE,
  PRIMARY KEY (id)
)