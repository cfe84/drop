use super::schema::{clients, cryptograms, drops};

#[derive(Insertable)]
#[table_name = "clients"]
pub struct NewClient<'a> {
  pub alias: &'a str,
  pub public_certificate: &'a str,
}

#[derive(Queryable, Serialize)]
pub struct Client {
  pub id: i32,
  pub alias: String,
  pub public_certificate: String,
}

// #[derive(Insertable)]
// #[table_name = "cryptograms"]
// pub struct NewCryptogram<'a> {
//   pub encrypted_text: &'a str,
//   pub created_date: &'a NaiveDate,
//   pub expiration_date: &'a NaiveDate,
// }
