#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;
#[macro_use]
extern crate serde;

use drop::data::models::{NewClient, Client};
use drop::data::{establish_connection, query_clients};
use rocket_contrib::json::Json;

#[derive(Serialize)]
struct JsonClientResponse {
    data: Vec<Client>,
}

#[get("/clients")]
fn clients_get() -> Json<JsonClientResponse> {
  let mut clients: Vec<Client> = vec![];
  let conn = establish_connection();
  let clients = query_clients(&conn);
  let response = JsonClientResponse {
    data: clients
  };
  Json(response)
}

fn main() {
  rocket::ignite().mount("/api", routes![clients_get]).launch();
}
