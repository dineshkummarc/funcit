steal(function(){

var events,
	timer;

// after a click collect all events until a timeout passes ... then it was a click or not
Funcit.filters.dblclick = function(ev, cb){
	///return ev;
	
	if(ev.type == 'click'){
		
		if(timer){ // we were a double click
			ev.type = 'dblclick';
			//console.log(events)
			events.push(ev)
			var call = events.slice(0);
			clearTimeout(timer);
			events = timer = undefined;
			
			
			
			return call;
		} else {
			
			events = [ev];
			timer = setTimeout(function(){
				var call = events.slice(0);
				timer = events = undefined;
				cb(call);
			},200)
			return true;
		}
		
	} else if(events){
		events.push(ev);
		return true;
	}
}
	
})
