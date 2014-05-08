define(["projectUserController", "angularMocks", "utils"], function(ProjectUserController, mocks, utils) {

    describe("projectUserControllerspec", function() {
        var scope, projectUserController, userService, q;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope;
            q = $q;
            userService = {
                'create': function() {},
                'getAllProjectUsers': function() {},
                'getAllUsernames': function() {}
            };

            scope.orgUnit = {
                "name": "Proj 1"
            };

            spyOn(userService, "getAllUsernames").and.returnValue(utils.getPromise(q, []));
            projectUserController = new ProjectUserController(scope, userService);
        }));

        it("should create user", function() {
            var user = {
                username: "ProJ_1_Blah",
                password: "P@ssw0rd",
                userRole: {
                    name: 'SomeRole',
                    id: 'someId'
                }
            };
            var expectedUserPayload = {
                "username": 'proj_1_blah',
                "surname": "LNU",
                "firstName": "FNU",
                "userCredentials": {
                    "username": user.username,
                    "userAuthorityGroups": [{
                        "name": user.userRole.name,
                        "id": user.userRole.id
                    }],
                    "password": user.password,
                }
            };
            spyOn(userService, "create").and.returnValue(utils.getPromise(q, {}));

            scope.save(user);
            scope.$apply();

            expect(userService.create).toHaveBeenCalledWith(expectedUserPayload);
            expect(scope.saveSuccess).toEqual(true);
            expect(scope.saveFailure).toEqual(false);
        });

        it("should determine username prefix and return validate username", function() {
            var projectName = "Some Project";
            var specifiedUserName = "some_Project_user1";

            scope.orgUnit.name = projectName;

            projectUserController = new ProjectUserController(scope, userService);

            expect(scope.userNamePrefix).toEqual("some_project_");
            expect(scope.userNameMatchExpr.test(specifiedUserName)).toEqual(true);
        });
    });
});