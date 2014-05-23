require.config({
    paths: {
        "Q": "lib/q/q",
        "lodash": "lib/lodash/dist/lodash",
        "properties": "app/conf/properties",
        "overrides": "app/conf/overrides",
        "indexedDBLogger": "app/utils/indexeddb.logger",
        "app": "app/bg.app",
        "hustle": "lib/hustle/hustle",
        "moment": "lib/moment/moment",
        "hustleInit": "app/hustle.init",

        "angular": "lib/angular/angular",

        //services
        "dataService": "app/service/data.service",
        "metadataService": "app/service/metadata.service",
        "services": "app/service/bg.services",

        "angular-indexedDB": "lib/angular-indexedDB/src/indexeddb",

        //Interceptors
        "httpInterceptor": "app/interceptors/http.interceptor"
    },
    shim: {
        'angular': {
            exports: 'angular'
        },
        'angular-indexedDB': {
            deps: ["angular"]
        }
    }
});
console.log("Config is complete");