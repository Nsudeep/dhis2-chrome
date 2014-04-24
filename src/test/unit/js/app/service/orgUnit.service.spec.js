define(["orgUnitService", "angularMocks", "properties"], function(OrgUnitService, mocks, properties) {
    describe("projects controller", function() {
        var http, httpBackend, scope, projectService;

        beforeEach(mocks.inject(function($rootScope, $httpBackend, $http) {
            scope = $rootScope.$new();
            http = $http;
            httpBackend = $httpBackend;
            orgUnitService = new OrgUnitService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should save organization unit in dhis", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1
            }];
            orgUnitService.create(orgUnit);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", {
                "organisationUnits": orgUnit
            }).respond(200, "ok");
            httpBackend.flush();
        });


        it("should send attributes along with metadata for project org units", function() {

            var payload = [{
                'id': 'a4acf9115a7',
                'name': 'Org1',
                'shortName': 'Org1',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
                "parent": {
                    name: 'Name1',
                    id: 'Id1'
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "value": "val1"
                }, {
                    "attribute": {
                        "code": "prjCon",
                        "name": "Context",
                        "id": "Gy8V8WeGgYs"
                    },
                    "value": "val2"
                }, {
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location",
                        "id": "CaQPMk01JB8"
                    },
                    "value": "val3"
                }, {
                    "attribute": {
                        "code": "prjType",
                        "name": "Type of project",
                        "id": "bnbnSvRdFYo"
                    },
                    "value": "val4"
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": "val5"
                }, {
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": "val6"
                }]
            }];


            var expectedPayload = {
                "organisationUnits": payload
            };

            orgUnitService.create(payload);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });

    });
});