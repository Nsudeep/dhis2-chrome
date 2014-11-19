define(["moment"], function(moment) {
    return function(db) {

    	var updatePeriod = function(eventsPayload){
            _.each(eventsPayload.events, function(event) {
                event.period = event.period || moment(event.eventDate).year() + "W" + moment(event.eventDate).isoWeek();
            });
            return eventsPayload;    		
    	};

        this.upsert = function(eventsPayload) {
            eventsPayload = updatePeriod(eventsPayload);
            var store = db.objectStore("programEvents");
            return store.upsert(eventsPayload.events).then(function() {
                return eventsPayload;
            });
        };

        this.getEvents = function(){
            var store = db.objectStore("programEvents");
            return store.getAll();  //TODO: Get recent events
        };

        this.delete = function(eventId){
            var store = db.objectStore("programEvents");
            return store.delete(eventId);
        };
    };
});