(function () {
    document.documentElement.lang = 'en';

    var data = [];

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

    function closest(num, arr) {
        var curr = arr[0];
        var diff = Math.abs (num - curr);
        for (var val = 0; val < arr.length; val++) {
            var newdiff = Math.abs (num - arr[val]);
            if (newdiff < diff) {
                diff = newdiff;
                curr = arr[val];
            }
        }
        return curr;
    }

    function loadRetro() {
        $.getJSON("https://performance-us-east-1-gaadstack-allygaad5a670049-141o6wjvy80ts.s3.amazonaws.com/totals.json", {_: new Date().getTime()}).done(function (thisYear) {
            $.getJSON("https://performance-us-east-1-gaadstack-allygaad5a670049-141o6wjvy80ts.s3.amazonaws.com/totals-2021.json", {_: new Date().getTime()}).done(function (lastYear) {
                var last = 0;
                var start0 = 1652871601000;
                var start1 = 1621422001000;
                var end1 = 1621594684717;
                var now0 = new Date().getTime();
                var increment = 300000;

                var points0 = [], points1 = [], labels0 = [], labels1 = [];
                var timestamps0 = [], timestamps1 = [];
                Object.keys(thisYear).forEach(function(value) {
                    timestamps0.push(Number(value));
                });
                Object.keys(lastYear).forEach(function(value) {
                    timestamps1.push(Number(value));
                });
                for (var ts0 = start0, ts1 = start1; ts0 < now0 && ts1 < end1; ts0 = ts0 + increment, ts1 = ts1 + increment) {
                    labels0.push(Number(ts0));
                    labels1.push(Number(ts1));
                }

                Object.values(labels0).forEach(function(ts) {
                    var match = closest(ts, timestamps0);
                    points0.push(thisYear[String(match)]);
                    last = thisYear[String(match)];
                });

                Object.values(labels1).forEach(function(ts) {
                    var match = closest(ts, timestamps1);
                    points1.push(lastYear[String(match)]);
                });

                Highcharts.chart('chart-container-compare', {
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
                        name: 'Fixes 2022',
                        color: "#00C7D1",
                        data: points0
                    },{
                        name: 'Fixes 2021',
                        color: "#00A7A1",
                        data: points1
                    }
                    ]
                });
            });
        });
    }
    
    function formatNumber(nr) {
    	return nr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    loadRetro();
    
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
		var t = getTimeRemaining(1621594801000);
		$('#gaad-hours').text(t.hours);
		$('#gaad-minutes').text(t.minutes);
		$('#gaad-seconds').text(t.seconds);
	};
    
    updateTimeRemaining();
    setInterval(updateTimeRemaining, 1000);

})();