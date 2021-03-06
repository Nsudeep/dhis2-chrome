define(["lodash", "moment", "properties", "orgUnitMapper"], function(_, moment, properties, orgUnitMapper) {
    return function($scope, $q, $hustle, $modal, $timeout, $location, $anchorScroll, programRepository, programEventRepository, systemSettingRepository,
        orgUnitRepository, approvalDataRepository) {

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var getPeriod = function() {
            return moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
        };

        var confirmAndProceed = function(okCallback, message, showModal) {
            if (showModal === false)
                return $q.when(okCallback());

            $scope.modalMessages = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            return modalInstance.result
                .then(function() {
                    return okCallback();
                }, function() {
                    //burp on cancel
                });
        };

        var markEventsAsSubmitted = function() {
            return programEventRepository.markEventsAsSubmitted($scope.program.id, getPeriod(), _.pluck($scope.originOrgUnits, "id"));
        };

        $scope.showResultMessage = function(messageType, message) {
            var hideMessage = function() {
                $scope.resultMessageType = "";
                $scope.resultMessage = "";
            };

            $scope.resultMessageType = messageType;
            $scope.resultMessage = message;
            $timeout(hideMessage, properties.messageTimeout);
            scrollToTop();
        };

        $scope.showPatientOriginInSummaryTable = function() {
            return $scope.program.name === "Burn Unit" || $scope.program.name === "Cholera Treatment Centre";
        };

        $scope.loadEventsView = function() {
            $scope.eventForm = {
                allEvents: []
            };
            $scope.eventForm.showEventForm = false;
            return programEventRepository.getEventsFor($scope.program.id, getPeriod(), _.pluck($scope.originOrgUnits, "id")).then(function(events) {
                $scope.eventForm.allEvents = events;
            });
        };

        $scope.getDisplayValue = function(dataValue) {
            if (!dataValue.value) return "";
            if (dataValue.optionSet && dataValue.optionSet.options.length > 0) {
                return _.find(dataValue.optionSet.options, function(o) {
                    return o.code === dataValue.value;
                }).name;
            } else {
                return dataValue.value;
            }
        };

        $scope.isDataEntryAllowed = function() {
            return moment($scope.minDateInCurrentPeriod).isAfter(moment().subtract(properties.projectDataSync.numWeeksToSync, 'week'));
        };

        $scope.isCurrentWeekSelected = function(week) {
            var today = moment().format("YYYY-MM-DD");
            if (week && today >= week.startOfWeek && today <= week.endOfWeek)
                return true;
            return false;
        };

        $scope.getFormattedDate = function(date) {
            return date ? moment(date).toDate().toLocaleDateString() : "";
        };

        $scope.submit = function() {
            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.selectedModule.id
            };

            var clearAnyExisingApprovals = function() {
                return approvalDataRepository.clearApprovals(periodAndOrgUnit);
            };

            var publishToDhis = function() {
                var uploadEventsPromise = $hustle.publish({
                    "type": "uploadProgramEvents",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadProgramEventsDesc + periodAndOrgUnit.period + ", Module: " + $scope.selectedModule.name
                }, "dataValues");

                var deleteApprovalsPromise = $hustle.publish({
                    "data": periodAndOrgUnit,
                    "type": "deleteApprovals",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.deleteApprovalsDesc + periodAndOrgUnit.period + ", Module: " + $scope.selectedModule.name
                }, "dataValues");

                return $q.all([uploadEventsPromise, deleteApprovalsPromise]);
            };

            var submit = function() {
                return markEventsAsSubmitted().then(function(submittedEvents) {
                    return clearAnyExisingApprovals().then(publishToDhis).then(function() {
                        $scope.showResultMessage("success", submittedEvents.length + $scope.resourceBundle.eventSubmitSuccess);
                        $scope.loadEventsView();
                    });
                });
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.reapprovalConfirmationMessage
            };
            var confirmIf = ($scope.isCompleted || $scope.isApproved);
            confirmAndProceed(submit, modalMessages, confirmIf);
        };

        $scope.submitAndApprove = function() {
            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.selectedModule.id
            };

            var markAsApproved = function() {
                var completedAndApprovedBy = $scope.currentUser.userCredentials.username;
                return approvalDataRepository.markAsApproved(periodAndOrgUnit, completedAndApprovedBy);
            };

            var publishToDhis = function() {
                var uploadProgramPromise = $hustle.publish({
                    "type": "uploadProgramEvents",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadProgramEventsDesc + periodAndOrgUnit.period + ", Module: " + $scope.selectedModule.name
                }, "dataValues");

                var uploadCompletionPromise = $hustle.publish({
                    "data": [periodAndOrgUnit],
                    "type": "uploadCompletionData",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadCompletionDataDesc + periodAndOrgUnit.period + ", Module: " + $scope.selectedModule.name
                }, "dataValues");

                var uploadApprovalPromise = $hustle.publish({
                    "data": [periodAndOrgUnit],
                    "type": "uploadApprovalData",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadApprovalDataDesc + periodAndOrgUnit.period + ", Module: " + $scope.selectedModule.name
                }, "dataValues");

                return $q.all([uploadProgramPromise, uploadCompletionPromise, uploadApprovalPromise]);
            };

            var submitAndApprove = function() {
                return markEventsAsSubmitted().then(function(submittedEvents) {
                    return markAsApproved().then(publishToDhis).then(function() {
                        $scope.showResultMessage("success", submittedEvents.length + $scope.resourceBundle.eventSubmitAndApproveSuccess);
                        $scope.loadEventsView();
                    });
                });
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.reapprovalConfirmationMessage
            };
            var confirmIf = ($scope.isCompleted || $scope.isApproved);
            confirmAndProceed(submitAndApprove, modalMessages, confirmIf);
        };

        $scope.deleteEvent = function(event) {
            var eventId = event.event;

            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.selectedModule.id
            };

            var clearAnyExisingApprovals = function() {
                return approvalDataRepository.clearApprovals(periodAndOrgUnit);
            };

            var publishToDhis = function() {
                var deleteEventPromise = $hustle.publish({
                    "data": eventId,
                    "type": "deleteEvent",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.deleteEventDesc
                }, "dataValues");

                var deleteApprovalsPromise = $hustle.publish({
                    "data": periodAndOrgUnit,
                    "type": "deleteApprovals",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.deleteApprovalsDesc + periodAndOrgUnit.period + ", Module: " + $scope.selectedModule.name
                }, "dataValues");

                return $q.all([deleteEventPromise, deleteApprovalsPromise]);
            };

            var hardDelete = function() {
                return programEventRepository.delete(eventId);
            };

            var softDelete = function() {
                event.localStatus = "DELETED";
                var eventsPayload = {
                    'events': [event]
                };

                return programEventRepository.upsert(eventsPayload)
                    .then(clearAnyExisingApprovals)
                    .then(publishToDhis);
            };

            var deleteOnConfirm = function() {
                var deleteFunction = event.localStatus === "NEW_DRAFT" || event.localStatus === "NEW_INCOMPLETE_DRAFT" ? hardDelete : softDelete;
                return deleteFunction.apply().then(function() {
                    $scope.showResultMessage("success", $scope.resourceBundle.eventDeleteSuccess);
                    $scope.loadEventsView();
                });
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.deleteEventConfirmation
            };

            confirmAndProceed(deleteOnConfirm, modalMessages);
        };

        $scope.loadEventDataEntryForm = function(event) {
            $scope.event = event;
            $scope.formTemplateUrl = "templates/partials/line-list-data-entry.html" + '?' + moment().format("X");
            $scope.eventForm.showEventForm = true;
        };

        var init = function() {
            $scope.dataType = "linelist";
        };

        var initializeForm = function() {
            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.selectedModule.id
            };

            var loadPrograms = function() {
                var getExcludedDataElementsForModule = function() {
                    return systemSettingRepository.get($scope.selectedModule.id).then(function(data) {
                        return data && data.value ? data.value.dataElements : [];
                    });
                };

                var getProgram = function(excludedDataElements) {
                    return orgUnitRepository.findAllByParent($scope.selectedModule.id).then(function(originOrgUnits) {
                        return programRepository.getProgramForOrgUnit(originOrgUnits[0].id).then(function(program) {
                            return programRepository.get(program.id, excludedDataElements);
                        });
                    });
                };

                return getExcludedDataElementsForModule().then(getProgram).then(function(program) {
                    $scope.program = program;
                    return program;
                });
            };

            var setUpProjectAutoApprovedFlag = function() {
                return orgUnitRepository.getParentProject($scope.selectedModule.id).then(function(orgUnit) {
                    $scope.projectIsAutoApproved = _.any(orgUnit.attributeValues, {
                        'attribute': {
                            'code': "autoApprove"
                        },
                        "value": "true"
                    });
                });
            };

            var setUpIsApprovedFlag = function() {
                return approvalDataRepository.getApprovalData(periodAndOrgUnit).then(function(data) {
                    $scope.isCompleted = !_.isEmpty(data) && data.isComplete;
                    $scope.isApproved = !_.isEmpty(data) && data.isApproved;
                });
            };

            var loadOriginsOrgUnits = function() {
                return orgUnitRepository.findAllByParent($scope.selectedModule.id).then(function(data) {
                    $scope.originOrgUnits = data;
                    $scope.originOrgUnitsById = _.indexBy(data, "id");
                });
            };

            $scope.minDateInCurrentPeriod = $scope.week.startOfWeek;
            $scope.maxDateInCurrentPeriod = $scope.week.endOfWeek;
            $scope.loading = true;
            $scope.formTemplateUrl = undefined;

            return $q.all([loadOriginsOrgUnits(), loadPrograms()]).then(function() {
                return $q.all([$scope.loadEventsView(), setUpProjectAutoApprovedFlag(), setUpIsApprovedFlag()]);
            }).finally(function() {
                $scope.loading = false;
            });
        };

        var deregisterModuleWeekInfoListener = $scope.$on('moduleWeekInfo', function(event, data) {
            $scope.selectedModule = data[0];
            $scope.week = data[1];
            initializeForm();
        });

        $scope.$on('$destroy', function() {
            deregisterModuleWeekInfoListener();
        });

        init();
    };
});
