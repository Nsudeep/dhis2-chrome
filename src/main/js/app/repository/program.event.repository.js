define(["moment", "lodash", "properties", "dateUtils"], function(moment, _, properties, dateUtils) {
    return function(db, $q) {
        this.upsert = function(eventsPayload) {
            var updatePeriod = function(eventsPayload) {
                _.each(eventsPayload.events, function(event) {
                    event.period = event.period || moment(event.eventDate).format("GGGG[W]WW");
                });
                return eventsPayload;
            };

            eventsPayload = updatePeriod(eventsPayload);

            var store = db.objectStore("programEvents");
            return store.upsert(eventsPayload.events).then(function() {
                return eventsPayload;
            });
        };

        this.getAll = function() {
            var store = db.objectStore("programEvents");
            return store.getAll().then(function(allEvents) {
                return allEvents;
            });
        };

        this.getEventsFromPeriod = function(startPeriod) {
            var endPeriod = moment().format("GGGG[W]WW");
            var store = db.objectStore('programEvents');
            var query = db.queryBuilder().$between(dateUtils.getFormattedPeriod(startPeriod), endPeriod).$index("by_period").compile();
            return store.each(query);
        };

        this.isDataPresent = function(orgUnitIds) {
            var query = orgUnitIds ? db.queryBuilder().$in(orgUnitIds).$index("by_organisationUnit").compile() : db.queryBuilder().$index("by_organisationUnit").compile();
            var store = db.objectStore('programEvents');
            return store.exists(query).then(function(data) {
                return data;
            });
        };

        this.delete = function(eventId) {
            var store = db.objectStore("programEvents");
            return store.delete(eventId);
        };

        this.markEventsAsSubmitted = function(programId, period, orgUnit) {
            var getEvents = function() {
                var store = db.objectStore('programEvents');
                var query = db.queryBuilder().$eq([programId, dateUtils.getFormattedPeriod(period), orgUnit]).$index("by_program_period_orgunit").compile();
                return store.each(query);
            };

            var updateEvents = function(events) {
                var eventsToBeSubmitted = _.filter(events, function(e) {
                    return e.localStatus === "DRAFT";
                });

                return _.map(eventsToBeSubmitted, function(e) {
                    e.localStatus = "NEW";
                    return e;
                });
            };

            return getEvents().then(updateEvents).then(function(newEvents) {
                var store = db.objectStore('programEvents');
                return store.upsert(newEvents);
            });
        };

        this.getEventsFor = function(programId, period, orgUnit) {

            var getProgram = function() {
                var store = db.objectStore('programs');
                return store.find(programId);
            };


            var getProgramStages = function(program) {
                var store = db.objectStore('programStages');
                var programStageIds = _.pluck(program.programStages, "id");
                return $q.all(_.map(programStageIds, function(programStageId) {
                    return store.find(programStageId);
                }));
            };

            var getDataElements = function() {
                var getDataElementIds = function(programStages) {
                    var programStageSections = _.flatten(_.pluck(programStages, "programStageSections"));
                    var programStageDataElements = _.flatten(_.pluck(programStageSections, "programStageDataElements"));
                    var dataElements = _.pluck(programStageDataElements, "dataElement");
                    return _.pluck(dataElements, "id");
                };

                return getProgram().then(getProgramStages).then(function(programStages) {
                    var store = db.objectStore("dataElements");
                    var dataElementIds = getDataElementIds(programStages);

                    return $q.all(_.map(dataElementIds, function(dataElementId) {
                        return store.find(dataElementId).then(function(dataElement) {
                            var attr = _.find(dataElement.attributeValues, {
                                "attribute": {
                                    "code": 'showInEventSummary'
                                }
                            });

                            if ((!_.isEmpty(attr)) && attr.value === "true") {
                                dataElement.showInEventSummary = true;
                            } else {
                                dataElement.showInEventSummary = false;
                            }
                            dataElement.dataElement = dataElement.id;
                            return _.omit(dataElement, ["id", "attributeValues"]);
                        });
                    }));
                });
            };

            var getEvents = function() {

                var excludeSoftDeletedEvents = function(events) {
                    return _.reject(events, function(e) {
                        return e.localStatus === "DELETED";
                    });
                };

                var store = db.objectStore('programEvents');
                var query = db.queryBuilder().$eq([programId, dateUtils.getFormattedPeriod(period), orgUnit]).$index("by_program_period_orgunit").compile();
                return store.each(query).then(excludeSoftDeletedEvents);
            };

            return $q.all([getDataElements(), getEvents()]).then(function(data) {
                var dataElements = data[0];
                var events = data[1];

                return _.map(events, function(programEvent) {
                    var mappedEvent = _.omit(programEvent, "dataValues");
                    mappedEvent.dataValues = _.cloneDeep(dataElements);
                    _.each(programEvent.dataValues, function(programEventDataValue) {
                        var mappedEventDataValue = _.find(mappedEvent.dataValues, {
                            'dataElement': programEventDataValue.dataElement
                        });
                        mappedEventDataValue.value = programEventDataValue.value;
                    });
                    return mappedEvent;
                });
            });
        };
    };
});
