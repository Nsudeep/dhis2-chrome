define(["downloadPatientOriginConsumer", "patientOriginService", "utils", "angularMocks", "patientOriginRepository", "timecop", "mergeBy"],
    function(DownloadPatientOriginConsumer, PatientOriginService, utils, mocks, PatientOriginRepository, timecop, MergeBy) {
        var downloadPatientOriginConsumer, patientOriginService, q, dhisPatientOriginDetails, patientOriginRepository, scope, mergeBy;
        describe("download patient origin consumer", function() {
            beforeEach(mocks.inject(function($q, $rootScope, $log) {
                scope = $rootScope.$new();
                q = $q;
                dhisPatientOriginDetails = [{
                    orgUnit: "prj1",
                    origins: [{
                        'id': 'origin1',
                        'name': 'origin1',
                        'latitude': '80',
                        'longitude': '180',
                        'clientLastUpdated': "2014-05-30T12:43:54.972Z"

                    }]
                }, {
                    orgUnit: "prj2",
                    origins: [{
                        'id': 'origin4',
                        'name': 'origin4',
                        'latitude': '80',
                        'longitude': '180',
                        'clientLastUpdated': "2014-05-30T12:43:54.972Z"
                    }]
                }];
                patientOriginService = new PatientOriginService();
                patientOriginRepository = new PatientOriginRepository();
                mergeBy = new MergeBy($log);
            }));

            it("should merge patient origin details", function() {
                var localOriginDetails = [{
                        orgUnit: "prj1",
                        origins: [{
                            'id': 'origin3',
                            'name': 'origin3',
                            'latitude': '80',
                            'longitude': '180',
                            'clientLastUpdated': "2014-06-01T12:50:54.972Z",
                        }]
                    }, {
                        orgUnit: "prj2",
                        origins: [{
                            'id': 'origin4',
                            'name': 'Neworigin4',
                            'latitude': '10',
                            'longitude': '5',
                            'clientLastUpdated': "2014-05-31T12:43:54.972Z"
                        }]
                    }

                ];

                spyOn(patientOriginService, "getAll").and.returnValue(utils.getPromise(q, dhisPatientOriginDetails));
                spyOn(patientOriginRepository, "upsert");
                spyOn(patientOriginRepository, "findAll").and.returnValue(utils.getPromise(q, localOriginDetails));

                downloadPatientOriginConsumer = new DownloadPatientOriginConsumer(patientOriginService, patientOriginRepository, mergeBy);
                downloadPatientOriginConsumer.run();

                scope.$apply();

                expect(patientOriginService.getAll).toHaveBeenCalled();

                var expectedUpserts = [{
                    orgUnit: "prj1",
                    origins: [{
                        'id': 'origin1',
                        'name': 'origin1',
                        'latitude': '80',
                        'longitude': '180',
                        'clientLastUpdated': "2014-05-30T12:43:54.972Z"

                    }, {
                        'id': 'origin3',
                        'name': 'origin3',
                        'latitude': '80',
                        'longitude': '180',
                        'clientLastUpdated': "2014-06-01T12:50:54.972Z",
                    }]
                }, {
                    orgUnit: "prj2",
                    origins: [{
                        'id': 'origin4',
                        'name': 'Neworigin4',
                        'latitude': '10',
                        'longitude': '5',
                        'clientLastUpdated': "2014-05-31T12:43:54.972Z"
                    }]
                }];

                expect(patientOriginService.getAll).toHaveBeenCalled();
                expect(patientOriginRepository.upsert.calls.argsFor(0)).toEqual([expectedUpserts[0]]);
                expect(patientOriginRepository.upsert.calls.argsFor(1)).toEqual([expectedUpserts[1]]);
            });
        });
    });
