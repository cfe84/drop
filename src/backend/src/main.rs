use drop::data;

fn main() {
    let connection = data::establish_connection();
    data::create_client(&connection, "hello");
    println!("Yo");
}
