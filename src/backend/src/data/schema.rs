table! {
    clients (alias) {
        alias -> Text,
        public_certificate -> Text,
    }
}

table! {
    cryptograms (id) {
        id -> Text,
        encrypted_text -> Text,
    }
}

table! {
    drops (id) {
        id -> Text,
        client_alias -> Text,
        encrypted_key -> Text,
        cryptogram_id -> Text,
    }
}

allow_tables_to_appear_in_same_query!(
    clients,
    cryptograms,
    drops,
);
