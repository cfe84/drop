use diesel::{prelude::*, sqlite::SqliteConnection};

pub mod models;
pub mod schema;

pub fn establish_connection() -> SqliteConnection {
  let db = "./testdb.sqlite3";
  SqliteConnection::establish(db).unwrap_or_else(|_| panic!("Error connecting to {}", db))
}

pub fn create_client(connection: &SqliteConnection, alias: &str, public_certificate: &str) {
  let client = models::NewClient {
    alias,
    public_certificate,
  };

  diesel::insert_into(schema::clients::table)
    .values(&client)
    .execute(connection)
    .expect("Error inserting new client");
}
