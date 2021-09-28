pub mod models;
pub mod schema;

use diesel::helper_types::Filter;
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

pub fn create_client(
  connection: &SqliteConnection,
  public_certificate: &str,
  pass: &str,
) -> Client {
  let alias = newGuid();
  let client = Client {
    alias,
    pass: String::from(pass),
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
    content_type: String::from("text/plain"),
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

pub fn query_cryptograms(
  connection: &SqliteConnection,
  cryptogram_id: &String,
) -> Option<Cryptogram> {
  use schema::cryptograms::dsl::*;
  let corresponding_cryptograms = cryptograms
    .filter(id.eq(cryptogram_id))
    .load::<Cryptogram>(connection)
    .expect("Error while retrieving drops");
  if corresponding_cryptograms.len() != 1 {
    return None;
  }
  let cryptogram = Clone::clone(&corresponding_cryptograms[0]);
  return Some(cryptogram);
}

pub fn query_drops(connection: &SqliteConnection, for_alias: &str) -> Vec<models::CompositeDrop> {
  use schema::drops::dsl::*;
  // let corresponding_drops = drops
  //   .inner_join(cryptograms::table)
  //   .filter(drops::client_alias.eq(client_alias))
  //   .select((
  //     drops::encrypted_key,
  //     drops::client_alias,
  //     cryptograms::encrypted_text,
  //   ))
  //   .load(connection)
  //   .expect("Error while retrieving drops");
  let corresponding_drops = drops
    .filter(client_alias.eq(for_alias))
    .load::<Drop>(connection)
    .expect("Error while retrieving drops");
  corresponding_drops
    .into_iter()
    .map(|drop| {
      let cryptogram_candidate = query_cryptograms(connection, &drop.cryptogram_id);
      match cryptogram_candidate {
        Some(cryptogram) => CompositeDrop {
          client_alias: drop.client_alias,
          encrypted_key: drop.encrypted_key,
          encrypted_text: String::clone(&(cryptogram.encrypted_text)),
          drop_id: Some(drop.id),
        },
        None => CompositeDrop {
          client_alias: drop.client_alias,
          encrypted_key: drop.encrypted_key,
          encrypted_text: format!("Cryptogram not found for drop {}", drop.cryptogram_id),
          drop_id: Some(drop.id),
        },
      }
    })
    .collect()
}
