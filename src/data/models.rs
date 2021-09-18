use super::schema::clients;

#[derive(Insertable)]
#[table_name = "clients"]
pub struct NewClient<'a> {
  pub alias: &'a str,
  pub public_certificate: &'a str,
}
