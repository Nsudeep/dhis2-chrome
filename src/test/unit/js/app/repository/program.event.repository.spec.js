define(["programEventRepository", "angularMocks", "utils", "moment", "properties"], function(ProgramEventRepository, mocks, utils, moment, properties) {
    describe("programEventRepository", function() {

        var scope, q, programEventRepository, mockDB;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope;

            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db, q);
        }));

        it("should extract period and case number and upsert event payload", function() {

            var dataElementsData = [{
                "id": "d1",
                "code": "code1_event_code"
            }, {
                "id": "d2",
                "code": "code2"
            }, {
                "id": "d3",
                "code": "code3_event_code"
            }, {
                "id": "d4",
                "code": "code4"
            }];

            mockStore.each.and.callFake(function(query) {
                if (mockStore.storeName === "dataElements")
                    return utils.getPromise(q, dataElementsData);
                return utils.getPromise(q, undefined);
            });

            var event1ForP1 = {
                "event": "ev1",
                "program": "p1",
                "programStage": "ps1",
                "orgUnit": "ou1",
                "eventDate": "2015-06-01T00:00:00",
                "dataValues": [{
                    "value": "C1",
                    "dataElement": "d1"
                }, {
                    "value": "Male_Emergency Department",
                    "dataElement": "d2"
                }]
            };

            var event2ForP1 = {
                "event": "ev2",
                "program": "p1",
                "programStage": "ps1",
                "orgUnit": "ou1",
                "eventDate": "2015-06-02T00:00:00",
                "dataValues": [{
                    "value": "C2",
                    "dataElement": "d1"
                }, {
                    "value": "Female_Emergency Department",
                    "dataElement": "d2"
                }]
            };

            var event3ForP2 = {
                "event": "ev3",
                "program": "p2",
                "programStage": "ps2",
                "orgUnit": "ou2",
                "eventDate": "2015-06-01T00:00:00",
                "dataValues": [{
                    "value": "C3",
                    "dataElement": "d3"
                }, {
                    "value": "Male_Burn Unit",
                    "dataElement": "d4"
                }]
            };

            var eventsPayload = {
                "events": [event1ForP1, event2ForP1, event3ForP2]
            };

            var returnValue;
            programEventRepository.upsert(eventsPayload).then(function(data) {
                returnValue = data;
            });
            scope.$apply();

            var expectedEvent1ForP1 = _.clone(event1ForP1);
            expectedEvent1ForP1.period = "2015W23";
            expectedEvent1ForP1.eventCode = "C1";

            var expectedEvent2ForP1 = _.clone(event2ForP1);
            expectedEvent2ForP1.period = "2015W23";
            expectedEvent2ForP1.eventCode = "C2";

            var expectedEvent3ForP2 = _.clone(event3ForP2);
            expectedEvent3ForP2.period = "2015W23";
            expectedEvent3ForP2.eventCode = "C3";

            var expectedEventData = {
                "events": [expectedEvent1ForP1, expectedEvent2ForP1, expectedEvent3ForP2]
            };

            expect(mockStore.each.calls.argsFor(0)[0].inList).toEqual(["d1", "d2", "d3", "d4"]);
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedEventData.events);
            expect(returnValue).toEqual(expectedEventData);
        });

        it("should get event by id", function() {
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db, q);

            programEventRepository.getEvent("ev1");
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith("ev1");
        });

        it("should delete events given ids", function() {
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db, q);

            programEventRepository.delete(["eventId1", "eventId2"]);
            scope.$apply();

            expect(mockStore.delete.calls.argsFor(0)).toEqual(["eventId1"]);
            expect(mockStore.delete.calls.argsFor(1)).toEqual(["eventId2"]);
        });

        it("should return true if events are present for the given orgunitids", function() {
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db, q);

            mockStore.exists.and.returnValue(utils.getPromise(q, true));

            programEventRepository.isDataPresent(['ou1', 'ou2']).then(function(actualResult) {
                expect(actualResult).toBeTruthy();
            });

            scope.$apply();
        });

        it("should return false if events are not present for the given orgunitids", function() {
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db, q);

            mockStore.exists.and.returnValue(utils.getPromise(q, false));

            programEventRepository.isDataPresent(['ou1', 'ou2']).then(function(actualResult) {
                expect(actualResult).toBeFalsy();
            });

            scope.$apply();
        });

        it("should get all events from given period", function() {
            var listOfEvents = [{
                'id': 'e1'
            }];

            mockDB = utils.getMockDB(q, [], [], listOfEvents);
            mockStore = mockDB.objectStore;

            programEventRepository = new ProgramEventRepository(mockDB.db, q);


            var actualEvents;
            programEventRepository.getEventsFromPeriod('2014W4').then(function(events) {
                actualEvents = events;
            });

            scope.$apply();

            expect(mockStore.each.calls.argsFor(0)[0].betweenX).toEqual("2014W04");
            expect(mockStore.each.calls.argsFor(0)[0].betweenY).toEqual(moment().format("GGGG[W]W"));

            expect(actualEvents).toEqual(listOfEvents);
        });

        it("should get events for particular period and orgUnit", function() {
            var program = {
                'id': 'p1',
                'programStages': [{
                    'id': 'p1s1'
                }]
            };

            var programStage = {
                'id': 'p1s1',
                'programStageSections': [{
                    'id': 'st1',
                    'programStageDataElements': [{
                        'dataElement': {
                            'id': 'de1'
                        }
                    }, {
                        'dataElement': {
                            'id': 'de2'
                        }
                    }]
                }]
            };

            var dataElements = [{
                'id': 'de1',
                'shortName': 'Age',
                "attributeValues": [{
                    "attribute": {
                        "code": "showInEventSummary",
                    },
                    "value": "true"
                }]
            }, {
                'id': 'de2',
                'shortName': 'PatientId',
            }, {
                'id': 'de3',
                'shortName': 'SomeNonProgramDataElement',
            }];

            var events = [{
                'event': 'event1',
                'eventDate': '2014-11-26T00:00:00',
                'dataValues': [{
                    'dataElement': 'de1',
                    'value': '20'
                }]
            }, {
                'event': 'event2',
                'eventDate': '2014-11-24T00:00:00',
                'dataValues': [{
                    'dataElement': 'de2',
                    'value': 'ABC1'
                }]
            }, {
                'event': 'event3',
                'eventDate': '2014-11-23T00:00:00',
                'localStatus': 'DELETED',
                'dataValues': [{
                    'dataElement': 'de1',
                    'value': '20'
                }]
            }];

            mockDB = utils.getMockDB(q, "", dataElements);
            mockStore = mockDB.objectStore;

            mockStore.find.and.callFake(function(id) {
                if (id === "p1")
                    return utils.getPromise(q, program);
                if (id === "p1s1")
                    return utils.getPromise(q, programStage);
                if (id === "de1")
                    return utils.getPromise(q, dataElements[0]);
                if (id === "de2")
                    return utils.getPromise(q, dataElements[1]);
                return utils.getPromise(q, undefined);
            });

            mockStore.each.and.returnValue(utils.getPromise(q, events));

            programEventRepository = new ProgramEventRepository(mockDB.db, q);

            var enrichedEvents;
            programEventRepository.getEventsFor("p1", "2014W1", "mod1").then(function(data) {
                enrichedEvents = data;
            });
            scope.$apply();

            var expectedEvents = [{
                event: 'event1',
                eventDate: '2014-11-26T00:00:00',
                dataValues: [{
                    shortName: 'Age',
                    showInEventSummary: true,
                    dataElement: 'de1',
                    value: '20',
                }, {
                    shortName: 'PatientId',
                    showInEventSummary: false,
                    dataElement: 'de2'
                }]
            }, {
                event: 'event2',
                eventDate: '2014-11-24T00:00:00',
                dataValues: [{
                    shortName: 'Age',
                    showInEventSummary: true,
                    dataElement: 'de1'
                }, {
                    shortName: 'PatientId',
                    showInEventSummary: false,
                    dataElement: 'de2',
                    value: 'ABC1',
                }]
            }];

            expect(enrichedEvents).toEqual(expectedEvents);
        });

        it("should get events for particular period and multiple orgUnits", function() {
            var program = {
                'id': 'p1',
                'programStages': [{
                    'id': 'p1s1'
                }]
            };

            var programStage = {
                'id': 'p1s1',
                'programStageSections': [{
                    'id': 'st1',
                    'programStageDataElements': [{
                        'dataElement': {
                            'id': 'de1'
                        }
                    }, {
                        'dataElement': {
                            'id': 'de2'
                        }
                    }]
                }]
            };

            var dataElements = [{
                'id': 'de1',
                'shortName': 'Age',
                "attributeValues": [{
                    "attribute": {
                        "code": "showInEventSummary",
                    },
                    "value": "true"
                }]
            }, {
                'id': 'de2',
                'shortName': 'PatientId',
            }, {
                'id': 'de3',
                'shortName': 'SomeNonProgramDataElement',
            }];

            var events = [{
                'event': 'event1',
                'eventDate': '2014-11-26T00:00:00',
                'orgUnit': "ou1",
                'dataValues': [{
                    'dataElement': 'de1',
                    'value': '20'
                }]
            }, {
                'event': 'event2',
                'eventDate': '2014-11-24T00:00:00',
                'orgUnit': "ou2",
                'dataValues': [{
                    'dataElement': 'de2',
                    'value': 'ABC1'
                }]
            }, {
                'event': 'event3',
                'eventDate': '2014-11-23T00:00:00',
                'orgUnit': "ou2",
                'localStatus': 'DELETED',
                'dataValues': [{
                    'dataElement': 'de1',
                    'value': '20'
                }]
            }];

            mockDB = utils.getMockDB(q, "", dataElements);
            mockStore = mockDB.objectStore;

            mockStore.find.and.callFake(function(id) {
                if (id === "p1")
                    return utils.getPromise(q, program);
                if (id === "p1s1")
                    return utils.getPromise(q, programStage);
                if (id === "de1")
                    return utils.getPromise(q, dataElements[0]);
                if (id === "de2")
                    return utils.getPromise(q, dataElements[1]);
                return utils.getPromise(q, undefined);
            });

            mockStore.each.and.callFake(function(args) {
                if (args.eq[2] === 'ou1') {
                    return utils.getPromise(q, [events[0]]);
                } else if (args.eq[2] === 'ou2') {
                    return utils.getPromise(q, [events[1], events[2]]);
                }
            });

            programEventRepository = new ProgramEventRepository(mockDB.db, q);

            var enrichedEvents;
            programEventRepository.getEventsFor("p1", "2014W1", ["ou1", "ou2"]).then(function(data) {
                enrichedEvents = data;
            });
            scope.$apply();

            var expectedEvents = [{
                event: 'event1',
                eventDate: '2014-11-26T00:00:00',
                orgUnit: "ou1",
                dataValues: [{
                    shortName: 'Age',
                    showInEventSummary: true,
                    dataElement: 'de1',
                    value: '20',
                }, {
                    shortName: 'PatientId',
                    showInEventSummary: false,
                    dataElement: 'de2'
                }]
            }, {
                event: 'event2',
                eventDate: '2014-11-24T00:00:00',
                orgUnit: "ou2",
                dataValues: [{
                    shortName: 'Age',
                    showInEventSummary: true,
                    dataElement: 'de1'
                }, {
                    shortName: 'PatientId',
                    showInEventSummary: false,
                    dataElement: 'de2',
                    value: 'ABC1',
                }]
            }];

            expect(enrichedEvents).toEqual(expectedEvents);
        });

        it("should mark event as submitted", function() {
            mockDB = utils.getMockDB(q, [], [], []);
            mockStore = mockDB.objectStore;

            var events = [{
                'event': 'event1',
                'eventDate': '2014-11-26T00:00:00',
                'localStatus': 'NEW_DRAFT',
                'dataValues': [{
                    'dataElement': 'de1',
                    'value': '20'
                }]
            }, {
                'event': 'event2',
                'eventDate': '2014-11-24T00:00:00',
                'dataValues': [{
                    'dataElement': 'de2',
                    'value': 'ABC1'
                }]
            }, {
                'event': 'event3',
                'eventDate': '2014-11-23T00:00:00',
                'localStatus': 'DELETED',
                'dataValues': [{
                    'dataElement': 'de1',
                    'value': '20'
                }]
            }, {
                'event': 'event4',
                'eventDate': '2014-11-26T00:00:00',
                'localStatus': 'UPDATED_DRAFT',
                'dataValues': [{
                    'dataElement': 'de1',
                    'value': '20'
                }]
            }];
            mockStore.each.and.returnValue(utils.getPromise(q, events));

            programEventRepository = new ProgramEventRepository(mockDB.db, q);

            programEventRepository.markEventsAsSubmitted("programId", "2014W7", "orgId");
            scope.$apply();

            var expectedPayload = [{
                event: 'event1',
                eventDate: '2014-11-26T00:00:00',
                localStatus: 'READY_FOR_DHIS',
                dataValues: [{
                    dataElement: 'de1',
                    value: '20'
                }]
            }, {
                event: 'event4',
                eventDate: '2014-11-26T00:00:00',
                localStatus: 'READY_FOR_DHIS',
                dataValues: [{
                    dataElement: 'de1',
                    value: '20'
                }]
            }];

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedPayload);
        });
    });
});
