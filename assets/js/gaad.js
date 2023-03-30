(function() {

	const goLiveTime = new Date(2023, 4, 18, 0, 0, 0, 0).getTime();
    
    function getTimeRemaining(endtime){
  		var t = endtime - new Date().getTime();
        if (t <= 0) {
            return {
                'total': 0,
                'days': 0,
                'hours': 0,
                'minutes': 0,
                'seconds': 0
              };
        }
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
		var t = getTimeRemaining(goLiveTime);
		$('#gaad-days').text(t.days);
		$('#gaad-hours').text(t.hours);
		$('#gaad-minutes').text(t.minutes);
		$('#gaad-seconds').text(t.seconds);
	};
    
    updateTimeRemaining();
    setInterval(updateTimeRemaining, 1000);

	// When the current time is greater than the go live time, swap index.html for index-leaderboard.html
	const interval = setInterval(function() {
        const now = new Date().getTime();
        if (now >= goLiveTime) {
            clearInterval(interval);
            window.location.href = "leaderboard.html";
        }
    }, 500);

    // When the window loads inserts some text followed by the goLiveTime as a readable date to the .gaad-date-container
	window.addEventListener('load', function() {
		const date = new Date(goLiveTime);
		const readableDate = date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric' });
		const text = 'Until Global Accessibility Awareness Day - ';
		$('#gaad-date-container').text(text + readableDate);
	});

})();
