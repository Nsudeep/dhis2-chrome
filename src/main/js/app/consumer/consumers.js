define(["uploadApprovalDataConsumer", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDatasetConsumer", "datasetConsumer", "systemSettingConsumer",
        "createUserConsumer", "updateUserConsumer", "dispatcher", "consumerRegistry", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer",
        "orgUnitRepository", "programRepository", "uploadProgramConsumer", "downloadProgramConsumer", "downloadEventDataConsumer", "deleteEventConsumer", "eventService", "programEventRepository", "uploadEventDataConsumer",
        "downloadApprovalConsumer", "downloadMetadataConsumer", "downloadOrgUnitGroupConsumer", "deleteApprovalConsumer"
    ],
    function(uploadApprovalDataConsumer, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDatasetConsumer, datasetConsumer, systemSettingConsumer,
        createUserConsumer, updateUserConsumer, dispatcher, consumerRegistry, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer,
        orgUnitRepository, programRepository, uploadProgramConsumer, downloadProgramConsumer, downloadEventDataConsumer, deleteEventConsumer, eventService, programEventRepository, uploadEventDataConsumer,
        downloadApprovalConsumer, downloadMetadataConsumer, downloadOrgUnitGroupConsumer, deleteApprovalConsumer) {

        var init = function(app) {
            app.service("downloadDataConsumer", ["dataService", "dataRepository", "datasetRepository", "userPreferenceRepository", "$q", "approvalDataRepository", downloadDataConsumer]);
            app.service("downloadApprovalConsumer", ["datasetRepository", "userPreferenceRepository", "$q", "approvalService", "approvalDataRepository", downloadApprovalConsumer]);
            app.service("uploadDataConsumer", ["dataService", "dataRepository", uploadDataConsumer]);
            app.service("uploadCompletionDataConsumer", ["approvalService", "approvalDataRepository", uploadCompletionDataConsumer]);
            app.service("uploadApprovalDataConsumer", ["approvalService", "approvalDataRepository", uploadApprovalDataConsumer]);
            app.service("downloadOrgUnitConsumer", ["orgUnitService", "orgUnitRepository", "changeLogRepository", "$q", downloadOrgUnitConsumer]);
            app.service("uploadOrgUnitConsumer", ["orgUnitService", "orgUnitRepository", "$q", uploadOrgUnitConsumer]);
            app.service("downloadOrgUnitGroupConsumer", ["orgUnitGroupService", "orgUnitGroupRepository", "changeLogRepository", "$q", downloadOrgUnitGroupConsumer]);
            app.service("uploadOrgUnitGroupConsumer", ["orgUnitGroupService", "orgUnitGroupRepository", "$q", uploadOrgUnitGroupConsumer]);
            app.service("downloadDatasetConsumer", ["datasetService", "datasetRepository", "$q", downloadDatasetConsumer]);
            app.service("datasetConsumer", ["datasetService", datasetConsumer]);
            app.service("systemSettingConsumer", ["systemSettingService", systemSettingConsumer]);
            app.service("createUserConsumer", ["userService", createUserConsumer]);
            app.service("updateUserConsumer", ["userService", updateUserConsumer]);
            app.service("dispatcher", ["$q", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDatasetConsumer", "datasetConsumer", "systemSettingConsumer", "createUserConsumer", "updateUserConsumer",
                "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer", "uploadApprovalDataConsumer", "uploadProgramConsumer", "downloadProgramConsumer", "downloadEventDataConsumer",
                "uploadEventDataConsumer", "deleteEventConsumer", "downloadApprovalConsumer", "downloadMetadataConsumer", "downloadOrgUnitGroupConsumer", "deleteApprovalConsumer", dispatcher
            ]);
            app.service("consumerRegistry", ["$hustle", "$q", "dispatcher", consumerRegistry]);
            app.service("uploadProgramConsumer", ["programService", "programRepository", "$q", uploadProgramConsumer]);
            app.service("downloadProgramConsumer", ["programService", "programRepository", "changeLogRepository", "$q", downloadProgramConsumer]);
            app.service("downloadEventDataConsumer", ["eventService", "programEventRepository", "$q", downloadEventDataConsumer]);
            app.service("uploadEventDataConsumer", ["eventService", "programEventRepository", "$q", uploadEventDataConsumer]);
            app.service("deleteEventConsumer", ["eventService", "programEventRepository", "$q", deleteEventConsumer]);
            app.service("downloadMetadataConsumer", ["metadataService", downloadMetadataConsumer]);
            app.service("deleteApprovalConsumer", ["approvalService", "$q", deleteApprovalConsumer]);
        };
        return {
            init: init
        };
    });
