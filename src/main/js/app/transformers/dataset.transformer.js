define(["lodash"], function(_) {

    var enrichDatasets = function(allDatasets, allSections, allDataElements, excludedDataElements) {
        allDatasets = _.cloneDeep(allDatasets);
        allSections = _.cloneDeep(allSections);
        allDataElements = _.groupBy(allDataElements, "id");

        var groupedSections = _.groupBy(allSections, function(section) {
            return section.dataSet.id;
        });

        var addFormNameToDataElement = function(dataElement) {
            var detailedDataElement = allDataElements[dataElement.id];
            dataElement.formName = detailedDataElement[0].formName;
            return dataElement;
        };

        _.each(allSections, function(section) {
            section.dataElements = _.map(section.dataElements, function(dataElement) {
                dataElement.isIncluded = _.isEmpty(excludedDataElements) ? true : !_.contains(excludedDataElements, dataElement.id);
                return addFormNameToDataElement(dataElement);
            });
        });

        _.each(allDatasets, function(dataset) {
            dataset.dataElements = [];
            dataset.sections = _.map(groupedSections[dataset.id], function(section) {
                section.isIncluded = !_.any(section.dataElements, {
                    "isIncluded": false
                });
                return section;
            });
        });

        return allDatasets;
    };

    var getAssociatedDatasets = function(orgUnitId, datasets) {
        return _.filter(_.cloneDeep(datasets), {
            'organisationUnits': [{
                'id': orgUnitId
            }]
        });
    };

    return {
        "enrichDatasets": enrichDatasets,
        "getAssociatedDatasets": getAssociatedDatasets
    };
});
