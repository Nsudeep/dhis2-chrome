define(["dataRepository", "angularMocks", "utils"], function(DataRepository, mocks, utils) {
    describe("data repository", function() {
        var q, db, mockStore, dataRepository, dataValues, scope;
        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            scope = $rootScope;
            dataRepository = new DataRepository(mockDB.db);
            dataValues = {
                dataValues: [{
                    period: '2014W15',
                    orgUnit: 'company_0',
                    dataElement: "DE1",
                    categoryOptionCombo: "COC1",
                    value: 1,
                }, {
                    period: '2014W15',
                    orgUnit: 'company_0',
                    dataElement: "DE2",
                    categoryOptionCombo: "COC2",
                    value: 2,
                }]
            };
        }));

        it("should save data values", function() {
            dataRepository.save(dataValues);
            expect(mockStore.upsert).toHaveBeenCalledWith([{
                period: '2014W15',
                dataValues: dataValues.dataValues,
                "orgUnit": "company_0"
            }]);
        });

        it("should save data values as draft", function() {
            dataRepository.saveAsDraft(dataValues);
            expect(mockStore.upsert).toHaveBeenCalledWith([{
                period: '2014W15',
                dataValues: dataValues.dataValues,
                "orgUnit": "company_0",
                "isDraft": true
            }]);
        });

        it("should get the data values", function() {
            dataRepository.getDataValues('period', 'orgUnitId');
            expect(mockStore.find).toHaveBeenCalledWith(['period', 'orgUnitId']);
        });

        it("should get data values by periods and orgunits", function() {
            mockStore.each.and.returnValue(utils.getPromise(q, [{
                "orgUnit": "ou1",
                "period": "2014W02"
            }, {
                "orgUnit": "ou1",
                "period": "2014W02"
            }, {
                "orgUnit": "ou3",
                "period": "2014W02"
            }]));

            var actualDataValues;
            dataRepository.getDataValuesForPeriodsOrgUnits("2014W02", "2014W03", ["ou1", "ou2"]).then(function(dataValues) {
                actualDataValues = dataValues;
            });

            scope.$apply();

            expect(actualDataValues).toEqual([{
                "orgUnit": "ou1",
                "period": "2014W02"
            }, {
                "orgUnit": "ou1",
                "period": "2014W02"
            }]);
        });
    });
});