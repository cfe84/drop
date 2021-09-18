table! {
    clients (id) {
        id -> Integer,
        alias -> Text,
        public_certificate -> Text,
    }
}

table! {
    cryptograms (id) {
        id -> Integer,
        encrypted_text -> Text,
        created_date -> Date,
        expiration_date -> Nullable<Date>,
    }
}

table! {
    drops (id) {
        id -> Integer,
        client_id -> Integer,
        encrypted_key -> Text,
        cryptogram_id -> Integer,
    }
}

allow_tables_to_appear_in_same_query!(
    clients,
    cryptograms,
    drops,
);
