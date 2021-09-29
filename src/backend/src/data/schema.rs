table! {
    clients (alias) {
        alias -> Text,
        pass -> Text,
        public_certificate -> Text,
    }
}

table! {
    cryptograms (id) {
        id -> Text,
        encrypted_text -> Text,
        content_type -> Text,
    }
}

table! {
    drops (id) {
        id -> Text,
        from_alias -> Text,
        client_alias -> Text,
        encrypted_key -> Text,
        cryptogram_id -> Text,
    }
}

joinable!(drops -> cryptograms (cryptogram_id));

allow_tables_to_appear_in_same_query!(
    clients,
    cryptograms,
    drops,
);
