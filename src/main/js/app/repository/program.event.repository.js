define(["moment", "lodash", "properties", "dateUtils"], function(moment, _, properties, dateUtils) {
    return function(db, $q) {
        this.upsert = function(eventsPayload) {

            var extractEventCode = function(events) {

                var getEventCodeDataElementIds = function() {
                    var store = db.objectStore("dataElements");
                    var uniqueDataElementIds = _.uniq(_.flatten(_.pluck(_.flatten(_.pluck(events, 'dataValues')), 'dataElement')));
                    var query = db.queryBuilder().$in(uniqueDataElementIds).compile();
                    return store.each(query).then(function(dataElements) {
                        return _.pluck(_.filter(dataElements, function(dataElement) {
                            return _.endsWith(dataElement.code, '_code');
                        }), "id");
                    });
                };

                var mergeEventCodesIntoEvents = function(dataElementsForEventCode) {
                    return _.map(events, function(ev) {
                        var dataElementContainingEventCode = _.find(ev.dataValues, function(dv) {
                            return _.contains(dataElementsForEventCode, dv.dataElement);
                        });
                        if (dataElementContainingEventCode)
                            ev.eventCode = dataElementContainingEventCode.value;
                        return ev;
                    });
                };

                return getEventCodeDataElementIds()
                    .then(mergeEventCodesIntoEvents);
            };

            var extractPeriod = function(events) {
                return _.map(events, function(ev) {
                    ev.period = ev.period || moment(ev.eventDate).format("GGGG[W]WW");
                    return ev;
                });
            };

            var doUpsert = function(events) {
                var store = db.objectStore("programEvents");
                return store.upsert(events).then(function() {
                    return {
                        "events": events
                    };
                });
            };

            return extractEventCode(eventsPayload.events)
                .then(extractPeriod)
                .then(doUpsert);
        };

        this.getEvent = function(eventId) {
            var store = db.objectStore("programEvents");
            return store.find(eventId);
        };

        this.getEventsFromPeriod = function(startPeriod, orgUnitIds) {
            var endPeriod = moment().format("GGGG[W]WW");
            var store = db.objectStore('programEvents');
            var query = db.queryBuilder().$between(dateUtils.getFormattedPeriod(startPeriod), endPeriod).$index("by_period").compile();
            return store.each(query).then(function(events) {
                if (!orgUnitIds) {
                    return events;
                }
                return _.filter(events, function(e) {
                    return _.contains(orgUnitIds, e.orgUnit);
                });
            });
        };

        this.isDataPresent = function(orgUnitId) {
            var query = orgUnitId ? db.queryBuilder().$eq(orgUnitId).$index("by_organisationUnit").compile() : db.queryBuilder().$index("by_organisationUnit").compile();
            var store = db.objectStore('programEvents');
            return store.exists(query).then(function(data) {
                return data;
            });
        };

        this.delete = function(eventIds) {
            eventIds = _.isArray(eventIds) ? eventIds : [eventIds];
            var store = db.objectStore("programEvents");
            return $q.all(_.map(eventIds, function(id) {
                return store.delete(id);
            }));
        };

        this.markEventsAsSubmitted = function(programId, period, orgUnitIds) {
            var getEvents = function() {
                var store = db.objectStore('programEvents');
                var queryPromises = _.map(orgUnitIds, function(orgUnitId) {
                    var query = db.queryBuilder().$eq([programId, dateUtils.getFormattedPeriod(period), orgUnitId]).$index("by_program_period_orgunit").compile();
                    return store.each(query);
                });

                return $q.all(queryPromises).then(function(events) {
                    return _.flatten(events);
                });
            };

            var updateEvents = function(events) {
                var eventsToBeSubmitted = _.filter(events, function(e) {
                    return e.localStatus === "NEW_DRAFT" || e.localStatus === "UPDATED_DRAFT";
                });

                return _.map(eventsToBeSubmitted, function(e) {
                    e.localStatus = "READY_FOR_DHIS";
                    return e;
                });
            };

            orgUnitIds = _.isArray(orgUnitIds) ? orgUnitIds : [orgUnitIds];
            return getEvents().then(updateEvents).then(function(newEvents) {
                var store = db.objectStore('programEvents');
                return store.upsert(newEvents).then(function() {
                    return newEvents;
                });
            });
        };

        this.getEventsFor = function(programId, period, orgUnitIds) {
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
                    events = _.flatten(events);
                    return _.reject(events, function(e) {
                        return e.localStatus === "DELETED";
                    });
                };

                orgUnitIds = _.isArray(orgUnitIds) ? orgUnitIds : [orgUnitIds];
                var store = db.objectStore('programEvents');

                var queryPromises = _.map(orgUnitIds, function(orgUnitId) {
                    var query = db.queryBuilder().$eq([programId, dateUtils.getFormattedPeriod(period), orgUnitId]).$index("by_program_period_orgunit").compile();
                    return store.each(query);
                });

                return $q.all(queryPromises).then(excludeSoftDeletedEvents);
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
