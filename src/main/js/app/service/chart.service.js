define([], function() {
    return function($http) {
        this.getChart = function() {
            var url = "http://localhost:8080/api/charts/acfb3bc012c/data.png";
            delete $http.defaults.headers.common['X-Requested-With'];
            return $http.get(url, {
                "responseType": "arraybuffer"
            }).then(function(response) {
                return response.data;
            });
        };
    };
});
