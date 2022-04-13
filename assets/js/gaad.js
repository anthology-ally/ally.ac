(function() {
    
    function getTimeRemaining(endtime){
  		var t = endtime - new Date().getTime();
  		var seconds = Math.floor( (t/1000) % 60 );
  		var minutes = Math.floor( (t/1000/60) % 60 );
  		var hours = Math.floor( (t/(1000*60*60)) % 24 );
  		var days = Math.floor( t/(1000*60*60*24) );
  		return {
    		'total': t,
    		'days': days,
    		'hours': hours,
    		'minutes': minutes,
    		'seconds': seconds
  		};
	}
	
	function updateTimeRemaining() {
		var t = getTimeRemaining(new Date(2022, 4, 19, 0, 0, 0, 0).getTime());
		$('#gaad-days').text(t.days);
		$('#gaad-hours').text(t.hours);
		$('#gaad-minutes').text(t.minutes);
		$('#gaad-seconds').text(t.seconds);
	};
    
    updateTimeRemaining();
    setInterval(updateTimeRemaining, 1000);
    
})();
