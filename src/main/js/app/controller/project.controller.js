define(["moment", "orgUnitMapper", "toTree", "properties"], function(moment, orgUnitMapper, toTree, properties) {

    return function($scope, $rootScope, $hustle, orgUnitRepository, $q, $location, $timeout, $anchorScroll, userRepository, $modal) {

        $scope.allProjectTypes = ['Direct', 'Indirect', 'Project excluded', 'Coordination', 'Remote Control'].sort();

        $scope.allContexts = ['Armed Conflict', 'Post-Conflict', 'Stable', 'Internal Instability'].sort();

        $scope.allPopTypes = ['Displaced', 'General Population', 'Mixed Displaced/General', 'Victims of Natural Disasters'].sort();

        var allEventsExceptOther = ['Armed Conflict: direct violence towards the civilian population', 'Armed Conflict: disruption of health systems due to conflict',
            'Armed Conflict: refugees/internally displaced people', 'Population affected by endemics/epidemics',
            'Population affected by natural disaster', 'Population affected by social violence and health care exclusion',
            'Victims of armed conflict'
        ].sort();

        $scope.allEvents = allEventsExceptOther.concat(['Other']);


        $scope.thisDate = moment().format("YYYY-MM-DD");

        $scope.openOpeningDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = true;
            $scope.endDate = false;
        };

        $scope.openEndDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = false;
            $scope.endDate = true;
        };

        $scope.reset = function() {
            $scope.saveFailure = false;
            $scope.newOrgUnit = {
                'openingDate': moment().format("YYYY-MM-DD")
            };
        };

        var publishMessage = function(data, action) {
            return $hustle.publish({
                "data": data,
                "type": action
            }, "dataValues").then(function() {
                return data;
            });
        };

        var saveToDbAndPublishMessage = function(dhisProject) {
            

            var onSuccess = function(data) {
                $rootScope.$broadcast('resetProjects');
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(data, "savedProject");
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            return orgUnitRepository.upsert(dhisProject)
                .then(function(data) {
                    return publishMessage(data, "upsertOrgUnit");
                })
                .then(onSuccess, onError);
        };

        $scope.update = function(newOrgUnit, orgUnit) {
            var dhisProject = orgUnitMapper.mapToExistingProject(newOrgUnit, orgUnit);
            saveToDbAndPublishMessage(dhisProject);
        };

        $scope.save = function(newOrgUnit, parentOrgUnit) {
            var dhisProject = orgUnitMapper.mapToProjectForDhis(newOrgUnit, parentOrgUnit);
            saveToDbAndPublishMessage(dhisProject);
        };

        $scope.toggleUserDisabledState = function(user) {
            $scope.toggleStateUsername = user.userCredentials.username;
            $scope.isUserToBeDisabled = !user.userCredentials.disabled;
            $scope.userStateSuccessfullyToggled = false;

            var modalInstance = $modal.open({
                templateUrl: 'templates/toggle-disable-state-confirmation.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            var onTimeOut = function() {
                $scope.userStateSuccessfullyToggled = false;
            };

            var okConfirmation = function() {
                user.userCredentials.disabled = $scope.isUserToBeDisabled;
                return userRepository.upsert(user)
                    .then(function(data) {
                        return publishMessage(data, "updateUser");
                    });
            };

            modalInstance.result.then(okConfirmation).then(function() {
                $scope.userStateSuccessfullyToggled = true;
                $timeout(onTimeOut, properties.messageTimeout);
            }, function() {
                $scope.userStateSuccessfullyToggled = false;
                $timeout(onTimeOut, properties.messageTimeout);
            });
        };

        $scope.isAfterMaxDate = function() {
            return moment($scope.newOrgUnit.openingDate).isAfter(moment($scope.thisDate));
        };

        $scope.setUserProject = function() {
            $scope.currentUser.organisationUnits = [$scope.orgUnit];
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var setProjectUsersForEdit = function(projectUsers) {
            $scope.projectUsers = [];
            _.each(projectUsers, function(user) {
                var roles = user.userCredentials.userAuthorityGroups.map(function(role) {
                    return role.name;
                });
                user.roles = roles.join(", ");
                $scope.projectUsers.push(user);
            });
        };

        var prepareNewForm = function() {
            $scope.reset();
            orgUnitRepository.getAll().then(function(allOrgUnits) {
                $scope.peerProjects = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
            });
        };

        var prepareEditForm = function() {
            $scope.reset();
            $scope.newOrgUnit = orgUnitMapper.mapToProjectForEdit($scope.orgUnit);
            userRepository.getAllProjectUsers($scope.orgUnit).then(setProjectUsersForEdit);
        };

        var init = function() {
            if ($scope.isNewMode)
                prepareNewForm();
            else
                prepareEditForm();
        };

        init();
    };
});