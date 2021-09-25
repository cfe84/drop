use super::schema::{clients, cryptograms, drops};

#[derive(Insertable, Queryable, Serialize, Clone)]
#[table_name = "clients"]
pub struct Client {
  pub alias: String,
  pub public_certificate: String,
}

#[derive(Insertable, Queryable, Serialize)]
#[table_name = "drops"]
pub struct Drop {
  pub client_alias: String,
  pub cryptogram_id: String,
  pub encrypted_key: String,
  pub id: String,
}

#[derive(Insertable, Queryable, Serialize)]
#[table_name = "cryptograms"]
pub struct Cryptogram {
  pub encrypted_text: String,
  pub id: String,
}

#[derive(Deserialize, Serialize)]
pub struct CompositeDrop {
  pub encrypted_text: String,
  pub encrypted_key: String,
  pub client_alias: String,
  pub drop_id: Option<String>,
}
