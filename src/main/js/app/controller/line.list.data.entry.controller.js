define(["lodash", "moment", "dhisId", "properties"], function(_, moment, dhisId, properties) {
    return function($scope, $q, $hustle, $modal, $timeout, $location, $anchorScroll, db, programRepository, programEventRepository, dataElementRepository) {
        var resetForm = function() {
            $scope.dataValues = {};
            $scope.eventDates = {};
            $scope.minDateInCurrentPeriod = $scope.week.startOfWeek;
            $scope.maxDateInCurrentPeriod = $scope.week.endOfWeek;
            getAllEvents();
        };

        var loadPrograms = function() {
            var getProgramAndStagesPromises = [];
            _.each($scope.programsInCurrentModule, function(programId) {
                getProgramAndStagesPromises.push(programRepository.getProgramAndStages(programId));
            });

            return $q.all(getProgramAndStagesPromises).then(function(allPrograms) {
                $scope.programs = allPrograms;
            });
        };

        var loadOptionSets = function() {
            var store = db.objectStore("optionSets");
            return store.getAll().then(function(opSets) {
                $scope.optionSets = opSets;
            });
        };

        var buildPayloadFromView = function(localStatus) {
            var newEvents = [];
            _.each($scope.programs, function(p) {
                _.each(p.programStages, function(ps) {
                    var event = {
                        'event': dhisId.get(p.id + ps.id + $scope.currentModule.id + moment().format()),
                        'program': p.id,
                        'programStage': ps.id,
                        'orgUnit': $scope.currentModule.id,
                        'eventDate': moment($scope.eventDates[p.id][ps.id]).format("YYYY-MM-DD"),
                        'dataValues': [],
                        'localStatus': localStatus
                    };
                    _.each(ps.programStageDataElements, function(psde) {
                        event.dataValues.push({
                            "dataElement": psde.dataElement.id,
                            "value": $scope.dataValues[p.id][ps.id][psde.dataElement.id]
                        });
                    });
                    newEvents.push(event);
                });
            });
            return {
                'events': newEvents
            };
        };

        var getAllEvents = function() {
            var period = $scope.year + "W" + $scope.week.weekNumber;
            var programIdsInCurrentModule = $scope.programsInCurrentModule;
            $scope.allEvents = [];
            return _.forEach(programIdsInCurrentModule, function(programId) {
                programEventRepository.getEventsFor(programId, period, $scope.currentModule.id).then(function(events) {
                    events = _.reject(events, function(e) {
                        return e.localStatus === "DELETED";
                    });
                    $scope.allEvents = $scope.allEvents.concat(events);
                });
            });
        };

        var showModal = function(okCallback, message) {
            $scope.modalMessage = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm.dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });
            modalInstance.result.then(okCallback);
        };

        $scope.getEventDateNgModel = function(eventDates, programId, programStageId) {
            eventDates[programId] = eventDates[programId] || {};
            eventDates[programId][programStageId] = eventDates[programId][programStageId] || new Date();
            return eventDates[programId];
        };

        $scope.getDataValueNgModel = function(dataValues, programId, programStageId) {
            dataValues[programId] = dataValues[programId] || {};
            dataValues[programId][programStageId] = dataValues[programId][programStageId] || {};
            return dataValues[programId][programStageId];
        };

        $scope.getOptionsFor = function(optionSetId) {
            var optionSet = _.find($scope.optionSets, function(os) {
                return optionSetId === os.id;
            });

            var options = optionSet ? optionSet.options : [];
            _.each(options, function(o) {
                o.displayName = $scope.resourceBundle[o.id] || o.name;
            });

            return options;
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var saveToDhis = function(data, type) {
            $scope.resultMessageType = "success";
            $scope.resultMessage = $scope.resourceBundle.eventSubmitSuccess;
            return $hustle.publish({
                "data": data,
                "type": type
            }, "dataValues");
        };

        $scope.submit = function(isDraft) {
            var newEventsPayload;
            if(isDraft)
                newEventsPayload = buildPayloadFromView("DRAFT");
            else
                newEventsPayload = buildPayloadFromView("NEW");
            return programEventRepository.upsert(newEventsPayload).then(function(payload) {
                $scope.resultMessageType = "success";
                $scope.resultMessage = $scope.resourceBundle.eventSaveSuccess;
                getAllEvents();
                scrollToTop();
                if (isDraft)
                    return payload;
                return saveToDhis(payload, "uploadProgramEvents");
            });
        };

        $scope.deleteEvent = function(event) {
            showModal(function() {
                var eventId = event.event;

                var hardDelete = function() {
                    return programEventRepository.delete(eventId);
                };

                var softDelete = function() {
                    event.localStatus = "DELETED";
                    var eventsPayload = {
                        'events': [event]
                    };
                    return programEventRepository.upsert(eventsPayload).then(function() {
                        return saveToDhis(eventId, "deleteEvent");
                    });
                };

                var deleteFunction = event.localStatus === "NEW" ? hardDelete : softDelete;

                return deleteFunction.apply().then(function() {
                    $scope.allEvents.splice(_.indexOf($scope.allEvents, event), 1);
                    $scope.deleteSuccess = true;
                    $timeout(function() {
                        $scope.deleteSuccess = false;
                    }, properties.messageTimeout);
                });
            }, $scope.resourceBundle.deleteEventConfirmation);
        };

        var init = function() {
            $scope.loading = true;
            resetForm();
            loadPrograms().then(loadOptionSets);
            $scope.loading = false;
        };

        init();
    };
});