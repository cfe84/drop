use drop::data;

fn main() {
    // let cli = clients::Clients::new();
    // let drops = drop::Drops::new();
    // drops.add_drop(String::from("Hi"), String::from("Hello"));
    // let f = drops.get_drop(String::from("Hello"));
    // println!("Content: {} = {}", f.code, f.content);
    let connection = data::establish_connection();
    data::create_client(&connection, "hello", "BLA");
    println!("Yo");
}
