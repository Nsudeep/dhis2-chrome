define(["dhisMonitor", "hustleMonitor"], function(dhisMonitor, hustleMonitor) {
    var init = function(app) {
        app.service('dhisMonitor', ['$http', '$log', dhisMonitor]);
        app.service('hustleMonitor', ['$hustle', '$log', hustleMonitor]);
    };

    return {
        init: init
    };
});
