use super::schema::{clients, cryptograms, drops};

#[derive(Insertable, Queryable, Serialize, Clone)]
#[table_name = "clients"]
pub struct Client {
  pub alias: String,
  pub pass: String,
  pub public_certificate: String,
}

#[derive(Insertable, Queryable, Serialize)]
#[table_name = "drops"]
pub struct Drop {
  pub id: String,
  pub client_alias: String,
  pub encrypted_key: String,
  pub cryptogram_id: String,
}

#[derive(Insertable, Queryable, Serialize, Clone)]
#[table_name = "cryptograms"]
pub struct Cryptogram {
  pub id: String,
  pub encrypted_text: String,
  pub content_type: String,
}

#[derive(Deserialize, Serialize)]
pub struct CompositeDrop {
  pub encrypted_text: String,
  pub encrypted_key: String,
  pub client_alias: String,
  pub drop_id: Option<String>,
}
