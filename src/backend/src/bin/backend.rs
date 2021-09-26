#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;
#[macro_use]
extern crate serde;
extern crate serde_json;

use drop::data::models::*;
use drop::data::{create_client, create_drop, establish_connection, get_client, query_drops};
use rocket::http::{ContentType, Status};
use rocket::response;
use rocket::response::Responder;
use rocket::Request;
use rocket::Response;
use rocket_contrib::json;
use rocket_contrib::json::*;
use rocket_contrib::serve::StaticFiles;

#[derive(Debug)]
struct ApiResponse {
  data: JsonValue,
  status: Status,
}

impl<'r> Responder<'r> for ApiResponse {
  fn respond_to(self, req: &Request) -> response::Result<'r> {
    Response::build_from(self.data.respond_to(&req).unwrap())
      .status(self.status)
      .header(ContentType::JSON)
      .ok()
  }
}

#[derive(Serialize)]
struct ClientPostResponse {
  alias: String,
}

#[derive(Deserialize)]
struct ClientPostRequest<'t> {
  publicKey: &'t str,
}

#[post("/clients", format = "application/json", data = "<client>")]
fn clients_post(client: Json<ClientPostRequest<'_>>) -> ApiResponse {
  let conn = establish_connection();
  let client = create_client(&conn, &client.publicKey);
  ApiResponse {
    data: json!({
      "result": "success",
      "data": { "alias": client.alias}
    }),
    status: Status::Ok,
  }
}

#[get("/clients/<alias>")]
fn client_get(alias: String) -> ApiResponse {
  let conn = establish_connection();
  let client_result = get_client(&conn, &alias);
  match client_result {
    Ok(client) => ApiResponse {
      data: json!({"result": "success", "data": client}),
      status: Status::Ok,
    },
    Err(message) => ApiResponse {
      data: json!({"result": "error", "error": message}),
      status: Status::NotFound,
    },
  }
}

#[post("/drops", format = "application/json", data = "<drop>")]
fn drops_post(drop: Json<CompositeDrop>) -> ApiResponse {
  let conn = establish_connection();
  let res = create_drop(&conn, &drop);
  ApiResponse {
    data: json!({
      "result": "success",
      "data": res
    }),
    status: Status::Ok,
  }
}

#[get("/clients/<alias>/drops")]
fn get_client_drops(alias: String) -> ApiResponse {
  let conn = establish_connection();
  let drops_result = query_drops(&conn, &alias);
  ApiResponse {
    data: json!({"result": "success", "data": drops_result}),
    status: Status::Ok,
  }
}

fn main() {
  rocket::ignite()
    .mount(
      "/api",
      routes![client_get, clients_post, drops_post, get_client_drops],
    )
    .mount("/", StaticFiles::from("..\\frontend"))
    .launch();
}
