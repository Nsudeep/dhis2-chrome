define(["metadataService", "filesystemService", "systemSettingService", "chartService"], function(metadataService, filesystemService, systemSettingService, chartService) {
    var init = function(app) {
        app.service('metadataService', ['$http', metadataService]);
        app.service('systemSettingService', ['$http', systemSettingService]);
        app.service('chartService', ['$http', chartService]);
        app.service('filesystemService', ['$q', filesystemService]);
    };
    return {
        init: init
    };
});
