CREATE TABLE clients (
    alias TEXT NOT NULL,
    public_certificate TEXT NOT NULL,
    UNIQUE(alias)
    PRIMARY KEY (alias)
);

CREATE TABLE drops (
    id TEXT NOT NULL,
    client_alias TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    cryptogram_id TEXT NOT NULL,
    UNIQUE(id)
    PRIMARY KEY (id)
    FOREIGN key (cryptogram_id) references cryptograms(id)
    FOREIGN key (client_alias) references clients(alias)
);

CREATE TABLE cryptograms (
  id TEXT NOT NULL,
  encrypted_text TEXT NOT NULL,
  -- created_date DATE NOT NULL,
  -- expiration_date DATE,
  UNIQUE (id)
  PRIMARY KEY (id)
)