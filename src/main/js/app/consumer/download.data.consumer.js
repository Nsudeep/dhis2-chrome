define(["moment", "properties", "lodash", "dateUtils"], function(moment, properties, _, dateUtils) {
    return function(dataService, dataRepository, datasetRepository, userPreferenceRepository, $q, approvalDataRepository, mergeBy) {
        this.run = function() {
            return downloadDataValues().then(mergeAndSaveDataValues);
        };

        var downloadDataValues = function() {
            var getAllDataValues = function(vals) {
                var orgUnitIds = vals[0];
                var allDataSetIds = _.pluck(vals[1], "id");

                if (orgUnitIds.length === 0 || allDataSetIds.length === 0)
                    return $q.when([]);

                var downloadPromises = _.map(orgUnitIds, function(orgUnitId) {
                    return dataRepository.isDataPresent(orgUnitId).then(function(data) {
                        var startDate = data ? dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync) : dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSyncOnFirstLogIn);
                        return dataService.downloadAllData([orgUnitId], allDataSetIds, startDate);
                    });
                });

                return $q.all(downloadPromises).then(function(data) {
                    return _.flatten(data);
                });
            };

            return $q.all([userPreferenceRepository.getUserModuleIds(), datasetRepository.getAll()])
                .then(getAllDataValues);
        };

        var mergeAndSaveDataValues = function(dataValuesFromDhis) {
            var getDataFromDb = function() {
                var m = moment();
                var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                var endPeriod = dateUtils.toDhisFormat(moment());
                var moduleIds = _.unique(_.pluck(dataValuesFromDhis, "orgUnit"));
                return dataRepository.getDataValuesForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds);
            };

            var dataValuesEquals = function(d1, d2) {
                return d1.dataElement === d2.dataElement && d1.period === d2.period && d1.orgUnit === d2.orgUnit && d1.categoryOptionCombo === d2.categoryOptionCombo;
            };

            var merge = function(dataValuesFromDhis, dataValuesFromDb) {
                return mergeBy.lastUpdated({
                    eq: dataValuesEquals
                }, dataValuesFromDhis, dataValuesFromDb);
            };

            var clearApprovals = function(originalData, mergedData) {
                var orgUnitAndPeriod = function(dataValue) {
                    return dataValue.orgUnit + dataValue.period;
                };

                var areEqual = function(originalDataValues, mergedDataValues) {
                    return originalDataValues.length === mergedDataValues.length && _.all(originalDataValues, function(dv) {
                        return _.any(mergedDataValues, function(mergedDv) {
                            return dataValuesEquals(dv, mergedDv) && dv.value === mergedDv.value;
                        });
                    });
                };

                var mergedDataGroupedByOuAndPeriod = _.groupBy(mergedData, orgUnitAndPeriod);
                var originalDataGroupedByOuAndPeriod = _.groupBy(originalData, orgUnitAndPeriod);

                var deleteApprovals = [];
                for (var ouAndPeriod in originalDataGroupedByOuAndPeriod) {
                    if (mergedDataGroupedByOuAndPeriod[ouAndPeriod] && !areEqual(originalDataGroupedByOuAndPeriod[ouAndPeriod], mergedDataGroupedByOuAndPeriod[ouAndPeriod])) {
                        var firstDataValue = originalDataGroupedByOuAndPeriod[ouAndPeriod][0];
                        deleteApprovals.push(approvalDataRepository.invalidateApproval(firstDataValue.period, firstDataValue.orgUnit));
                    }
                }

                return $q.all(deleteApprovals).then(function() {
                    return mergedData;
                });
            };

            if (_.isEmpty(dataValuesFromDhis))
                return;

            return getDataFromDb().then(function(dataFromLocalDb) {
                var mergedData = merge(dataValuesFromDhis, dataFromLocalDb);
                return clearApprovals(dataFromLocalDb, mergedData).then(dataRepository.saveDhisData);
            });
        };
    };
});
