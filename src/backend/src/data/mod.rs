pub mod models;
pub mod schema;

use diesel::{prelude::*, sqlite::SqliteConnection};
use models::*;
use uuid::Uuid;

fn newGuid() -> String {
  Uuid::new_v4().to_hyphenated().to_string()
}

pub fn establish_connection() -> SqliteConnection {
  let db = "./testdb.sqlite3";
  SqliteConnection::establish(db).unwrap_or_else(|_| panic!("Error connecting to {}", db))
}

pub fn create_client(connection: &SqliteConnection, public_certificate: &str) -> Client {
  let alias = newGuid();
  let client = Client {
    alias,
    public_certificate: String::from(public_certificate),
  };

  diesel::insert_into(schema::clients::table)
    .values(&client)
    .execute(connection)
    .expect("Error inserting new client");
  client
}

pub fn get_client<'a>(connection: &SqliteConnection, client_alias: &str) -> Result<Client, String> {
  use schema::clients::dsl::*;
  let corresponding_clients = clients
    .filter(alias.eq(client_alias))
    .load::<Client>(connection)
    .expect("Error while retrieving clients");
  if corresponding_clients.len() != 1 {
    return Err(format!(
      "Found {} clients with alias {}",
      corresponding_clients.len(),
      client_alias
    ));
  }
  let client = Clone::clone(&corresponding_clients[0]);
  return Ok(client);
}

pub fn create_drop(connection: &SqliteConnection, compositeDrop: &CompositeDrop) -> CompositeDrop {
  let cryptogram_id = newGuid();
  let drop_id = newGuid();
  let cryptogram = Cryptogram {
    id: String::clone(&cryptogram_id),
    encrypted_text: String::clone(&compositeDrop.encrypted_text),
  };
  let drop = Drop {
    client_alias: String::clone(&compositeDrop.client_alias),
    cryptogram_id: String::clone(&cryptogram_id),
    encrypted_key: String::clone(&compositeDrop.encrypted_key),
    id: String::clone(&drop_id),
  };
  diesel::insert_into(schema::cryptograms::table)
    .values(&cryptogram)
    .execute(connection)
    .expect("Error inserting new cryptogram");
  diesel::insert_into(schema::drops::table)
    .values(&drop)
    .execute(connection)
    .expect("Error inserting new drop");
  CompositeDrop {
    client_alias: String::clone(&compositeDrop.client_alias),
    drop_id: Some(drop_id),
    encrypted_key: String::clone(&compositeDrop.encrypted_key),
    encrypted_text: String::clone(&compositeDrop.encrypted_text),
  }
}

// pub fn query_drops(
//   connection: &SqliteConnection,
//   client_alias: &str,
// ) -> Vec<models::CompositeDrop> {
//   schema::drop::table.
//   // schema::dr::table
//   //   .load::<models::Client>(connection)
//   //   .expect("Couldn't retrieve clients")
// }
