define(["extractHeaders", "lodash"], function(extractHeaders, _) {

    var getBooleanAttributeValue = function(attributes, attributeCode) {
        var attr = _.find(attributes, {
            "attribute": {
                "code": attributeCode
            }
        });
        return attr && attr.value === "true";
    };

    var getAttributeValue = function(attributes, attributeCode) {
        var attr = _.find(attributes, {
            "attribute": {
                "code": attributeCode
            }
        });
        if (attr && attr.value)
            return attr.value;
        else
            return undefined;
    };

    this.mapDatasetForView = function(dataset) {
        var resultDataset = _.pick(dataset, ["id", "name", "shortName", "organisationUnits", "sections"]);
        resultDataset.isAggregateService = !getBooleanAttributeValue(dataset.attributeValues, "isLineListService") && !getBooleanAttributeValue(dataset.attributeValues, "isOriginDataset");
        resultDataset.isLineListService = getBooleanAttributeValue(dataset.attributeValues, "isLineListService");
        resultDataset.isOriginDataset = getBooleanAttributeValue(dataset.attributeValues, "isOriginDataset");
        resultDataset.isNewDataModel = getBooleanAttributeValue(dataset.attributeValues, "isNewDataModel");
        return resultDataset;
    };

    this.enrichWithSectionsAndDataElements = function(allDatasets, allSections, allDataElements, excludedDataElements) {
        var indexedSections = _.indexBy(allSections, "id");
        var indexedDataElements = _.indexBy(allDataElements, "id");

        var enrichSections = function(sections) {
            return _.map(sections, function(section) {
                var enrichedSection = _.pick(indexedSections[section.id], "id", "name", "sortOrder", "dataElements");
                enrichedSection.dataElements = enrichDataElements(enrichedSection.dataElements);
                enrichedSection.isIncluded = !_.every(enrichedSection.dataElements, {
                    "isIncluded": false
                });
                return enrichedSection;
            });
        };

        var enrichDataElements = function(dataElements) {
            return _.map(dataElements, function(dataElement) {
                var enrichedDataElement = _.pick(indexedDataElements[dataElement.id], "id", "name", "formName", "categoryCombo");
                var associatedProgram = getAttributeValue(indexedDataElements[dataElement.id].attributeValues, "associatedProgram");
                if (!_.isEmpty(associatedProgram))
                    enrichedDataElement.associatedProgramId = associatedProgram;
                enrichedDataElement.isIncluded = _.isEmpty(excludedDataElements) ? true : !_.contains(excludedDataElements, dataElement.id);
                return enrichedDataElement;
            });
        };

        return _.map(allDatasets, function(dataset) {
            dataset.sections = enrichSections(dataset.sections);
            return dataset;
        });
    };

    this.enrichWithCategoryOptionCombinations = function(dataSets, allCategoryCombos, allCategories, allCategoryOptionCombos) {
        var enrichedCategories = function(categoryComboId) {
            var categories = _.find(allCategoryCombos, _.matchesProperty('id', categoryComboId)).categories;
            return _.map(categories, function(category) {
                return _.find(allCategories, _.matchesProperty('id', category.id));
            });
        };

        return _.map(dataSets, function(dataSet) {
            _.each(dataSet.sections, function(section) {
                var categoryCombo = _.first(section.dataElements).categoryCombo;
                var categories = enrichedCategories(categoryCombo.id);
                var result = extractHeaders(categories, categoryCombo, allCategoryOptionCombos);
                section.headers = result.headers;
                section.categoryOptionComboIds = result.categoryOptionComboIds;
                return section;
            });

            return dataSet;
        });
    };

    return this;
});
