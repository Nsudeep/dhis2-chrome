define(["dataValuesConsumer", "consumerRegistry"], function(dataValuesConsumer, consumerRegistry) {
    var init = function(app) {
        app.service("dataValuesConsumer", ["dataService", dataValuesConsumer]);
        app.service("consumerRegistry", ["$hustle", "dataValuesConsumer", "$q", consumerRegistry]);
    };
    return {
        init: init
    };
});