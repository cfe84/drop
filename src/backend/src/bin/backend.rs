#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;
#[macro_use]
extern crate serde;
extern crate serde_json;

use drop::data::models::*;
use drop::data::{create_client, create_drop, establish_connection, get_client, query_drops};
use rocket::http::{ContentType, Status};
use rocket::request::FromRequest;
use rocket::request::Outcome;
use rocket::response;
use rocket::response::Responder;
use rocket::Request;
use rocket::Response;
use rocket_contrib::json;
use rocket_contrib::json::*;
use rocket_contrib::serve::StaticFiles;
use std::convert::Infallible;
use std::{thread, time};

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
  pass: &'t str,
  publicKey: &'t str,
}

#[post("/clients", format = "application/json", data = "<client>")]
fn clients_post(client: Json<ClientPostRequest<'_>>) -> ApiResponse {
  let conn = establish_connection();
  let client = create_client(&conn, &client.publicKey, &client.pass);
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
  let wait_time = time::Duration::from_secs(1);
  thread::sleep(wait_time);
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

struct Pass(String);

#[derive(Debug)]
enum PassError {
  Missing,
}

impl<'a, 'r> FromRequest<'a, 'r> for Pass {
  type Error = PassError;

  fn from_request(request: &'a Request<'r>) -> Outcome<Self, Self::Error> {
    let pass = request.headers().get_one("pass");
    match pass {
      Some(pass) => Outcome::Success(Pass(pass.to_string())),
      None => Outcome::Failure((Status::Unauthorized, PassError::Missing)),
    }
  }
}

#[get("/clients/<alias>/drops")]
fn get_client_drops(alias: String, pass: Pass) -> ApiResponse {
  let conn = establish_connection();
  let clientResult = get_client(&conn, &alias);
  match clientResult {
    Ok(client) => {
      if client.pass != pass.0 {
        return ApiResponse {
          data: json!({ "result": "failure", "error": "Incorrect password"}),
          status: Status::Forbidden,
        };
      }
    }
    Err(err) => {
      return ApiResponse {
        data: json!({"result": "failure", "error": "No pass was submitted"}),
        status: Status::Unauthorized,
      }
    }
  }
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
