define(["moment", "properties", "lodash", "chartUtils", "chromeUtils"], function(moment, properties, _, chartUtils, chromeUtils) {
    return function($scope, $hustle, $q, $rootScope, $timeout, chartService) {
        var init = function() {
            return chartService.getChart().then(function(image) {
                console.log(typeof(image));
                var base64Img = chartUtils.toBase64(image);
                setTimeout(function() {
                    return chromeUtils.getChart("acfb3bc012c", function(result) {
                        $scope.chartImage = "data:image/png;base64," + result.acfb3bc012c;
                        console.log($scope.chartImage);
                    });
                }, 1000);
            });
        };

        init();
    };
});
