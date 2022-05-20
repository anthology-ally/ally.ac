(function () {
    document.documentElement.lang = 'en';

    var data = [];
    var regionalLeaders = [];

    function renderItem(fixdata) {
        var badge = "";
        if (fixdata.position < 4) {
            badge = "pos-badge";
        }
    
        $("#leaderboard .table_body").append(`
            <tr class="">
                <td class="text-center position ${badge}"><span>${fixdata.position}</span></td>
                <td class="logo table_white table_left_side_radius text-center" aria-hidden="true">
                	<span class="logo_container">
                		<img src="/assets/img/logos/${fixdata.logo}.png" alt="" />
                	</span>
                </td>
                <td class="details table_white">
                    <div class="details_name">${fixdata.details.name}</div>
                    <div>${fixdata.details.location}</div>
                    <div class="details_small visible-xs">
                    	<div class="details_small_fixes">
                            <img src="/assets/img/leaderboard/tick.svg" alt="Fixes" title="Fixes">
                            <span>${fixdata.fixes}</span>
                        </div>
                        <div>
                            <img src="/assets/img/leaderboard/head.svg" alt="Students" title="Students">
                            <span>${fixdata.students}</span>
                        </div>
                    </div>
                </td>
                <td class="hidden-xs text-center table_white">${fixdata.fixes}</td>
                <td class="hidden-xs text-center table_white">${fixdata.students}</td>
                <td class="text-center table_grey table_right_side_radius">${fixdata.fixes_per_student}</td>
            </tr>
            `)
    }

    function renderRegion(fixdata) {
        $("#regional_leaders").append(`
        	<div class="col-xs-12 col-sm-6">
        		<h3 class="regional_leader_region">${fixdata.details.location}</h3>
        		<div>
        		<table width="100%">
                            <thead class="hidden">
                                <tr class=" ">
                                    <th aria-hidden="true" style="width: 90px;"><span class="sr-only">Logo</span></th>
                                    <th><span class="sr-only">Institution name</span></th>
                                    <th style="width: 150px;">Fixes per student</th>
                                </tr>
                            </thead>
                            <tbody class="table_body">
				<tr class="">
                <td class="logo table_white table_left_side_radius text-center" aria-hidden="true">
                	<span class="logo_container">
                		<img src="/assets/img/logos/${fixdata.logo}.png" alt="" />
                	</span>
                </td>
                <td class="details table_white">
                    <div class="details_name">${fixdata.details.name}</div>
                    <div>${fixdata.details.location}</div>
                    <div class="details_small">
                    	<div class="details_small_fixes">
                            <img src="/assets/img/leaderboard/tick.svg" alt="Fixes" title="Fixes">
                            <span>${fixdata.fixes}</span>
                        </div>
                        <div>
                            <img src="/assets/img/leaderboard/head.svg" alt="Students" title="Students">
                            <span>${fixdata.students}</span>
                        </div>
                    </div>
                </td>
                <td class="text-center table_grey table_right_side_radius">${fixdata.fixes_per_student}</td>
            	</tr>
                            </tbody>
                        </table>
        		
        		</div>
        	</div>
        `);
    }

    function renderAll() {
        $("#leaderboard .table_body").html('');
        data.forEach(element => {
            renderItem(element);
        });
        $(".units").text(data.length);
    }

    function renderTopFive() {
        $("#leaderboard .table_body").html('');
        data.slice(0, 5).forEach(element => {
            renderItem(element);
        });
        $(".units").text(data.length);
    }

    function renderRegionalLeaders() {
        $("#regional_leaders").html('');
        for(var key in regionalLeaders) {
            var leader = regionalLeaders[key];
            renderRegion(leader);
        }
    }

    var show = 'top5';

    $('.table_show_full').on('click', function (e) {
        if (show === 'top5') {
            show = 'all';
            $('.table_show_full').text('Collapse list');
            renderAll();
        } else if (show === 'all') {
            show = 'top5';
            $('.table_show_full').text('Show full list');
            renderTopFive();
        }
        
        e.preventDefault();
    });

    function loadData() {
        $.getJSON("https://performance-us-east-1-gaadstack-allygaad5a670049-141o6wjvy80ts.s3.amazonaws.com/clients.json", {_: new Date().getTime()}).done(function (results) {
            $.getJSON("https://performance-us-east-1-gaadstack-allygaad5a670049-141o6wjvy80ts.s3.amazonaws.com/fte.json", {_: new Date().getTime()}).done(function (response) {
                for (var key in results) {
                    var value = results[key];

                    var uniDetails = response[key];
                    var fixesPerStudent = 0;
                    if (uniDetails) {
                        if (value && value > 0) {
                            fixesPerStudent = value / uniDetails.fte;
                        }

                        var logo = key;
                        if (("hasLogo" in uniDetails && !uniDetails.hasLogo)) {
                            logo = "nologo";
                        }
                        var details = {
                            "details": {
                                "name": uniDetails.name,
                                "location": uniDetails.location
                            },
                            "fixes": formatNumber(value),
                            "students": formatNumber(uniDetails.fte),
                            "fixes_per_student": fixesPerStudent.toFixed(5),
                            "id": key,
                            "logo": logo
                        };
                        data.push(details);
                    } else {
                        console.log(`Received info for unknown client ${key}`);
                    }
                }

                data.sort(function (left, right) {
                    return Number(right.fixes_per_student) - Number(left.fixes_per_student);
                });

                var position = 1;
                data.forEach(element => {
                    element.position = position++;
                });

                const threshold = Number(100);
                const overallWinner = data[0];
                data.forEach(element => {
                    // According to the rules, each participant may only be selected as a winner for 1 of the possible winner categories
                    if (element.id !== overallWinner.id) {
                        const location = element.details.location;
                        const fixes = Number(element.fixes.replace(',', ''));
                        if (location in regionalLeaders) {
                            const leader = regionalLeaders[location];
                            if (fixes > threshold && Number(leader.fixes_per_student) < Number(element.fixes_per_student)) {
                                regionalLeaders[location] = element;
                            }
                        } else {
                            if (fixes > threshold) {
                                regionalLeaders[location] = element;
                            }
                        }
                    }
                    
                });
                renderTopFive();
                renderRegionalLeaders();
            })
                .fail(function (data) {
                    console.log(data);
                });
        });
    }

    function loadGraph() {
        function showConfetti(actual, thresholdLow, thresholdHigh, cookieName, message) {
            const confettiStatus = Cookies.get(cookieName);

            if (actual > thresholdLow && actual < thresholdHigh && !confettiStatus) {
                Cookies.set(cookieName, 'true');

                var confettiSettings = { 
                    'target': 'my-canvas',
                    'respawn': false
                };
                var confetti = new ConfettiGenerator(confettiSettings);
                confetti.render();

                $("#leaderboard").append(`<div id='record'>${message}</div>`);
                $('#record').css({top:'50%',left:'50%',margin:'-'+($('#record').height() / 2)+'px 0 0 -'+($('#record').width() / 2)+'px'});
                $('#record').fadeOut(10000, function() {$('#record').remove(); });
            }
        }

        $.getJSON("https://performance-us-east-1-gaadstack-allygaad5a670049-141o6wjvy80ts.s3.amazonaws.com/totals.json", {_: new Date().getTime()}).done(function (response) {
            var labels = [];
            var points = [];
            var last = 0;
            for (var timestamp in response) {
                var fixes = response[timestamp];
                labels.push(Number(timestamp));
                points.push(fixes);
                last = fixes;
            }

            showConfetti(last, 50000, 100000, 'confetti_2022_50k', 'Wow! We fixed 50,000 files!');
            showConfetti(last, 100000, 108546, 'confetti_2022_100k', 'Wow! We fixed 100,000 files!');
            showConfetti(last, 108546, 200000, 'confetti_2022_2021', 'Wow! We beat the last year\'s record!');
            showConfetti(last, 200000, 1000000, 'confetti_2022_1m', 'Wow! We fixed 200,000 files!');

            Highcharts.chart('chart-container', {
                chart: {
                    type: 'line',
                    backgroundColor: 'transparent',
                    color: '#00C7D1',
                    height: '300px'
                },
                credits: {
                	enabled: false
                },
                legend: {
                    enabled: false
                },
                title: {
                    text: 'Total fixes around the world',
                    align: 'left',
                    style: { "color": "#FFF", "fontSize": "20px", "fontWeight" : "bold", "line-height": "15px", "fontFamily": "Roboto" }
                },
                caption: {
                    text: formatNumber(last),
                    style: { "color": "#000", "fontSize": "16px" },
                    y: 60,
                    verticalAlign: "top",
                    useHTML: true
                },
                xAxis: {
                    visible: false
                },
                yAxis: {
                    visible: false
                },
                tooltip: {
                	headerFormat: "",
                	pointFormat: "Fixes: <b>{point.y}</b>",
                	backgroundColor: "#14676A",
                	borderColor: "#14676A",
                	style: {
                		color: "#FFF",
                		fontSize: "13px"
                	},
                	padding: 10
                },
                plotOptions: {
                    line: {
                    	lineWidth: 4,
                    	marker: {
                    		enabled: false
                    	}
                    }
                },
                series: [{
                    name: 'Fixes',
                    color: "#00C7D1",
                    data: points
                }]
            });

        });
    }
    
    function formatNumber(nr) {
    	return nr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    loadData();
    loadGraph();
    
    function getTimeRemaining(endtime){
  		var t = endtime - new Date().getTime();
  		if (t < 0) {
  			t = 0;
  		}
  		var seconds = Math.floor( (t/1000) % 60 );
  		var minutes = Math.floor( (t/1000/60) % 60 );
  		var hours = Math.floor( (t/(1000*60*60)) );
  		return {
    		'total': t,
    		'hours': hours,
    		'minutes': minutes,
    		'seconds': seconds
  		};
	}
	
	function updateTimeRemaining() {
		var t = getTimeRemaining(1653044401000);
		$('#gaad-hours').text(t.hours);
		$('#gaad-minutes').text(t.minutes);
		$('#gaad-seconds').text(t.seconds);
	};
    
    updateTimeRemaining();
    setInterval(updateTimeRemaining, 1000);

})();