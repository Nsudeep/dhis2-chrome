define(["lodash", "moment", "dhisUrl", "properties"], function(_, moment, dhisUrl, properties) {
    return function($http, $q) {
        this.downloadAllData = function(orgUnitIds, dataSetIds, startDate) {
            var today = moment().format("YYYY-MM-DD");
            var onSuccess = function(response) {
                if (_.isEmpty(response.data))
                    return [];
                return _.map(response.data.dataValues, function(dataValue) {
                    dataValue.period = moment(dataValue.period, "GGGG[W]W").format("GGGG[W]WW");
                    return dataValue;
                });
            };

            return $http.get(dhisUrl.dataValueSets, {
                "params": {
                    "orgUnit": orgUnitIds,
                    "children": true,
                    "dataSet": dataSetIds,
                    "startDate": startDate,
                    "endDate": today
                }
            }).then(onSuccess);
        };

        this.save = function(dataValues) {

            var sucessResponse = function(response) {
                if (response.data.status === "ERROR") {
                    return $q.reject(response);
                }
                return response;
            };

            var errorResponse = function(response) {
                return $q.reject(response);
            };

            var payload = {
                "dataValues": dataValues
            };
            return $http.post(dhisUrl.dataValueSets, payload).then(sucessResponse, errorResponse);
        };
    };
});
