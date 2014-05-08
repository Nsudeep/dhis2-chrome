define(["userService", "angularMocks", "properties", "utils"], function(UserService, mocks, properties, utils) {
    describe("user service", function() {
        var http, httpBackend, userService, db, mockOrgStore, q, rootScope;

        beforeEach(mocks.inject(function($httpBackend, $http, $q, $rootScope) {
            http = $http;
            httpBackend = $httpBackend;
            q = $q;
            rootScope = $rootScope;

            mockOrgStore = {
                upsert: function() {},
                getAll: function() {}
            };
            db = {
                objectStore: function() {}
            };

            spyOn(db, "objectStore").and.returnValue(mockOrgStore);

            userService = new UserService(http, db);
        }));

        it("should create user", function() {
            var user = {
                "username": "someone@example.com",
                "password": "Handique"
            };
            spyOn(mockOrgStore, "upsert").and.returnValue(utils.getPromise(q, "someData"));

            userService.create(user).then(function(data) {
                expect(data).toEqual("someData");
            });

            expect(mockOrgStore.upsert).toHaveBeenCalledWith(user);
            httpBackend.expectPOST(properties.dhis.url + "/api/users", user).respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all project users", function() {
            var projUser1 = {
                "username": "proj_1_user1",
            };

            var projUser2 = {
                "username": "proj_1_user2"
            };

            var users = [projUser1, projUser2, {
                "username": "proj_2_user1"
            }, {
                "username": "someone@example.com"
            }]

            spyOn(mockOrgStore, "getAll").and.returnValue(utils.getPromise(q, users));

            userService.getAllProjectUsers("Proj 1").then(function(data) {
                expect(data.length).toEqual(2);
                expect(data[0]).toEqual(projUser1);
                expect(data[1]).toEqual(projUser2);
            });
            rootScope.$apply();
        });

        it("should get all usernames", function() {
            var users = [{
                "username": "proj_2_user1"
            }, {
                "username": "someone@example.com"
            }];
            spyOn(mockOrgStore, "getAll").and.returnValue(utils.getPromise(q, users));

            userService.getAllUsernames().then(function(usernames) {
                expect(usernames).toEqual(["proj_2_user1", "someone@example.com"]);
            });
            rootScope.$apply();
        });
    });
});