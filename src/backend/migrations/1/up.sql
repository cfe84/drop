CREATE TABLE clients (
    alias TEXT NOT NULL,
    pass TEXT NOT NULL,
    public_key TEXT NOT NULL,
    UNIQUE(alias)
    PRIMARY KEY (alias)
);


CREATE TABLE cyphers (
  cypher_id TEXT NOT NULL,
  encrypted_text TEXT NOT NULL,
  content_type TEXT NOT NULL,
  created_date DATE NOT NULL,
  -- expiration_date DATE,
  UNIQUE (cypher_id)
  PRIMARY KEY (cypher_id)
);

CREATE TABLE drops (
    drop_id INT NOT NULL,
    from_alias TEXT NOT NULL,
    to_alias TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    cypher_id TEXT NOT NULL,
    UNIQUE(drop_id)
    PRIMARY KEY (drop_id)
    FOREIGN key (cypher_id) references cryptograms(cypher_id)
    FOREIGN key (to_alias) references clients(alias)
    FOREIGN key (from_alias) references clients(alias)
)