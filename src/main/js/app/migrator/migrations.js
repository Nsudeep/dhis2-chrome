define([], function() {
    var create_data_store = function(stores, db) {
        _.each(stores, function(type) {
            db.createObjectStore(type, {
                keyPath: "id"
            });
        });
    };

    var create_store_with_key = function(storeName, key, db) {
        return db.createObjectStore(storeName, {
            keyPath: key
        });
    };

    var create_index = function(store, indexName, key, isUnique, multiEntry) {
        store.createIndex(indexName, key, {
            "unique": isUnique,
            "multiEntry": multiEntry || false
        });
    };

    var add_object_stores = function(db, tx) {
        syncable_types = ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections", "programStages", "optionSets"];
        create_data_store(syncable_types, db);
    };

    var add_system_settings_store = function(db, tx) {
        create_store_with_key("systemSettings", "key", db);
    };

    var change_log_stores = function(db, tx) {
        create_store_with_key("changeLog", "type", db);
    };

    var create_datavalues_store = function(db, tx) {
        var dataValueStore = create_store_with_key("dataValues", ["period", "orgUnit"], db);
        create_index(dataValueStore, "by_period", "period", false);
    };

    var add_organisation_units_and_level_store = function(db, tx) {
        syncable_types = ["organisationUnits", "organisationUnitLevels"];
        create_data_store(syncable_types, db);
    };

    var add_user_store_for_dhis_users = function(db, tx) {
        create_store_with_key("users", "userCredentials.username", db);
    };

    var add_local_user_credentials_store = function(db, tx) {
        create_store_with_key("localUserCredentials", "username", db);
    };

    var add_admin_user_to_local_cred_store = function(db, tx) {
        var credStore = tx.objectStore("localUserCredentials");
        credStore.add({
            "username": "msfadmin",
            "password": "f6b30a5547c4062f915aafd3e4e6453a"
        });
        var userStore = tx.objectStore("users");
        userStore.add({
            "userCredentials": {
                "username": "msfadmin",
                "userRoles": [{
                    "name": "Superuser",
                }],
                "disabled": false
            }
        });
    };

    var add_project_user_to_local_cred_store = function(db, tx) {
        var userStore = tx.objectStore("localUserCredentials");
        userStore.add({
            "username": "project_user",
            "password": "caa63a86bbc63b2ae67ef0a069db7fb9"
        });
    };

    var add_user_preference_store = function(db, tx) {
        var userPrefenreceStore = create_store_with_key("userPreferences", "username", db);
    };

    var add_translation_store = function(db, tx) {
        var translationsStore = create_store_with_key("translations", ["objectUid", "locale"], db);
        create_index(translationsStore, "by_locale", "locale", false);
    };

    var add_complete_datasets_store = function(db, tx) {
        var completeDataSetsStore = create_store_with_key("completedDataSets", ["period", "orgUnit"], db);
        create_index(completeDataSetsStore, "by_period", "period", false);
    };

    var add_approval_datasets_store = function(db, tx) {
        var approvalDataSetsStore = create_store_with_key("approvedDataSets", ["period", "orgUnit"], db);
        create_index(approvalDataSetsStore, "by_period", "period", false);
    };

    // var add_accepted_datasets_store = function(db, tx) {
    //     var acceptedDataSetsStore = create_store_with_key("acceptedDataSets", ["period", "orgUnit"], db);
    //     create_index(acceptedDataSetsStore, "by_period", "period", false);
    // };

    var add_programs_store = function(db, tx) {
        var programStore = create_store_with_key("programs", "id", db);
        create_index(programStore, "by_organisationUnit", "orgUnitIds", false, true);
    };

    var add_program_events_store = function(db, tx) {
        var programEventsStore = create_store_with_key("programEvents", "event", db);
        create_index(programEventsStore, "by_program_period_orgunit", ["program", "period", "orgUnit"], false);
        create_index(programEventsStore, "by_period", "period", false);
    };

    var add_org_unit_group_store = function(db, tx) {
        create_store_with_key("orgUnitGroups", ["id"], db);
    };

    return [add_object_stores,
        change_log_stores,
        add_organisation_units_and_level_store,
        create_datavalues_store,
        add_user_store_for_dhis_users,
        add_local_user_credentials_store,
        add_admin_user_to_local_cred_store,
        add_project_user_to_local_cred_store,
        add_translation_store,
        add_org_unit_group_store,
        add_system_settings_store,
        add_user_preference_store,
        add_complete_datasets_store,
        add_approval_datasets_store,
        add_programs_store,
        add_program_events_store
    ];
});