(function() {
    const publicBucketUrl = "https://performance-us-east-1-gaadstack-allygaad5a670049-141o6wjvy80ts.s3.amazonaws.com/";
    const yearsConfig = [
        {
            year: 2021,
            date: Date.parse("2021-05-18T00:00:00Z"),
            urlTotals: publicBucketUrl + "totals-2021.json",
            urlClients: publicBucketUrl + "clients-2021.json",
            urlDetails: publicBucketUrl + "fte-2021.json",
            achievements: [50000, 100000, 108546, 150000],
        },
        {
            year: 2022,
            date: Date.parse("2022-05-20T00:00:00Z"),
            urlTotals: publicBucketUrl + "totals.json",
            urlClients: publicBucketUrl + "clients.json",
            urlDetails: publicBucketUrl + "fte.json",
            achievements: [50000, 100000, 108546, 150000],
        },
        {
            year: 2023,
            date: Date.parse("2023-05-18T00:00:00Z"),
            urlTotals: publicBucketUrl + "totals2023.json",
            urlClients: publicBucketUrl + "clients2023.json",
            urlDetails: publicBucketUrl + "gaad-fte2023.json",
            achievements: [50000, 100000, 110248, 150000],
        },
        {
            year: 2024,
            date: Date.parse("2024-10-03T00:00:00Z"),
            urlTotals: publicBucketUrl + "totals2024.json",
            urlClients: publicBucketUrl + "clients2024.json",
            urlDetails: publicBucketUrl + "gaad-fte2024.json",
            achievements: [20000, 40000, 89937, 100000],
        },
    ];

    class ManagedVariable {
        constructor(value) {
            this.value = value;
            this.subscribers = [];
        }

        set(value) {
            this.value = value;
            for(const callback of this.subscribers) {
                callback(this.value);
            }
        }

        subscribe(callback) {
            this.subscribers.push(callback);
        }
    }

    function use() {
        const args = Array.from(arguments);
        const fn = args.pop();
        const managedVariables = args;
        fn.commonTrigger = () => {
            const values = managedVariables.map(mv => mv.value);
            fn(...values);
        }
        for(const mv of managedVariables) {
            mv.subscribe(fn.commonTrigger);
        }
        fn.commonTrigger();
    }

    let year$ = new ManagedVariable(yearsConfig[yearsConfig.length-1]);
    let leaderboard$ = new ManagedVariable(false);
    let show$ = new ManagedVariable('top5');
    let data$ = new ManagedVariable({}); // year -> data
    let regionalLeaders$ = new ManagedVariable({}); // year -> regionalLeaders
    let totals$ = new ManagedVariable({}); // year -> totals

    function formatNumber(nr) {
        return nr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function getTimeRemaining(endtime){
        var t = endtime - new Date().getTime();
        if (t <= 0) {
            t = 0;
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

    function renderAll(data) {
        $("#leaderboard .table_body").html('');
        if(data) {
            data.forEach(element => {
                renderItem(element);
            });
            $(".units").text(data.length);
        }
    }

    function renderTopFive(data) {
        $("#leaderboard .table_body").html('');
        if(data) {
            data.slice(0, 5).forEach(element => {
                renderItem(element);
            });
            $(".units").text(data.length);
        }
    }

    function showConfetti(actual, thresholdLow, thresholdHigh, cookieName, message) {
        const confettiStatus = Cookies.get(cookieName);

        if (actual > thresholdLow && actual < thresholdHigh && !confettiStatus) {
            Cookies.set(cookieName, 'true');

            var confettiSettings = {
                'target': 'confetti-canvas',
                'respawn': false
            };
            var confetti = new ConfettiGenerator(confettiSettings);
            confetti.render();

            $("#leaderboard").append(`<div id='record'>${message}</div>`);
            $('#record').css({top:'50%',left:'50%',margin:'-'+($('#record').height() / 2)+'px 0 0 -'+($('#record').width() / 2)+'px'});
            $('#record').fadeOut(10000, function() {$('#record').remove(); });
        }
    }

    function loadTotals(year) {
        if (totals$.value[year.year]) return;

        $.getJSON(year.urlTotals, {_: new Date().getTime()}).done(function (response) {
            var labels = [];
            var points = [];
            var last = 0;
            for (var timestamp in response) {
                var fixes = response[timestamp];
                labels.push(Number(timestamp));
                points.push(fixes);
                last = fixes;
            }

            totals$.set({
                ...totals$.value,
                [year.year]: {
                    labels, points, last
                },
            })
        });
    }

    function loadData(year) {
        if (data$.value[year.year]) return;

        /**
         * Hack for 2023- to add a suffix as a special case for these institutions
         * @type {string[]}
         */
        const institutionsWithSuffix = [
            'Lanier Technical College',
            'Southern Crescent Technical College',
            'North Georgia Technical College',
            'Southern Regional Technical College',
            'Georgia Piedmont Technical College',
            'Albany Technical College',
            'Ogeechee Technical College',
            'Columbus Technical College',
            'Coastal Pines Technical College',
            'Ogeechee Technical College',
            'Wiregrass Georgia Technical College',
            'Augusta Technical College',
            'Athens Technical College',
            'Georgia Adult Education',
            'Atlanta Technical College',
            'Central Georgia Technical College',
            'Augusta Technical College'
        ];
        // if the institution name is in the institutionsWithSuffix array, return the suffix
        function getSuffix(name) {
            if(institutionsWithSuffix.includes(name)) {
                return ' - Part of TCSG';
            } else {
                return '';
            }
        }

        $.getJSON(year.urlClients, {_: new Date().getTime()}).done(function (results) {
            $.getJSON(year.urlDetails, {_: new Date().getTime()}).done(function (response) {
                const data = [];
                const regionalLeaders = [];

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
                                "name": uniDetails.name + getSuffix(uniDetails.name),
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
                const secondPlace = data[1];
                const thirdPlace = data[2];
                data.forEach(element => {
                    // According to the rules, each participant may only be selected as a winner for 1 of the possible winner categories
                    if (element.id !== overallWinner.id && element.id !== secondPlace.id && element.id !== thirdPlace.id) {
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

                data$.set({...data$.value, [year.year]: data});
                regionalLeaders$.set({...regionalLeaders$.value, [year.year]: Object.values(regionalLeaders)});
            })
            .fail(function (data) {
                console.log(data);
            });
        });
    }

    let intervalTimeRemaining;
    let timeoutGoLive;

    use(year$, (year) => {
        const goLiveTime = year.date - 12 * 36e5; // First time zone
        const endTime = year.date + (24 + 13) * 36e5; // 24 hours + last time zone

        const yearIndex = yearsConfig.indexOf(year);

        const yearNav = $("#gaad-year-nav")
        yearNav.find('.next-year').off("click");
        if(yearIndex < yearsConfig.length-1) {
            yearNav.find('.next-year').on("click", () => year$.set(yearsConfig[yearIndex+1]));
        }
        yearNav.find('.next-year').attr("disabled", !(yearIndex < yearsConfig.length-1));

        yearNav.find('.year').text(year.year);

        yearNav.find('.prev-year').off("click");
        if(yearIndex > 0) {
            yearNav.find('.prev-year').on("click", () => year$.set(yearsConfig[yearIndex-1]));
        }
        yearNav.find('.prev-year').attr("disabled", !(yearIndex > 0));

        function updateTimeRemaining(time) {
            const t = getTimeRemaining(time) ;
            $('#gaad-days').text(t.days);
            $('#gaad-hours').text(t.hours);
            $('#gaad-minutes').text(t.minutes);
            $('#gaad-seconds').text(t.seconds);
        }

        if (new Date().getTime() < goLiveTime) {
            const readableDate = new Date(year.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: "UTC" });
            const text = 'Until Fix Your Content Day - ';
            $('#gaad-date-container').text(text + readableDate);
            $('#gaad-date-container-sr').text('Time remaining until the Fix Your Content Day');

            if (intervalTimeRemaining) clearInterval(intervalTimeRemaining);
            intervalTimeRemaining = setInterval(() => updateTimeRemaining(goLiveTime), 1000);
            updateTimeRemaining(goLiveTime);
        } else {
            $('#gaad-date-container').text('To the end of Fix Your Content Day');
            $('#gaad-date-container-sr').text('Time remaining until the end of the Fix Your Content Day');

            if (intervalTimeRemaining) clearInterval(intervalTimeRemaining);
            intervalTimeRemaining = setInterval(() => updateTimeRemaining(endTime), 1000);
            updateTimeRemaining(endTime);
        }

        if(timeoutGoLive) clearTimeout(timeoutGoLive);
        if (new Date().getTime() > goLiveTime) {
            leaderboard$.set(true);
            loadTotals(year);
            loadData(year);
        } else {
            leaderboard$.set(false);
            const liveIn = goLiveTime - new Date().getTime();
            timeoutGoLive = setTimeout(() => {
                leaderboard$.set(true);
                loadTotals(year);
                loadData(year);
            }, liveIn)
        }
    });

    use(leaderboard$, (leaderboard) => {
        if(leaderboard) {
            $('.gaad-overview').hide();
            $('.gaad-leaderboard').show();
        } else {
            $('.gaad-overview').show();
            $('.gaad-leaderboard').hide();
        }
    });

    use(totals$, year$, (totals, year) => {
        if(totals[year.year]) {
            const {points, last} = totals[year.year];

            const thousandsString = (num) => {
                const numStr = num.toString();
                const thousands = numStr.substring(0, numStr.length - 3);
                return `${thousands}k`;
            }

            showConfetti(
                last, year.achievements[0], year.achievements[1],
                `confetti_${year.year}_${thousandsString(year.achievements[0])}`,
                `Wow! We fixed ${formatNumber(year.achievements[0])} files!`
            );
            showConfetti(
                last, year.achievements[1], year.achievements[2],
                `confetti_${year.year}_${thousandsString(year.achievements[1])}`,
                `Wow! We fixed ${formatNumber(year.achievements[1])} files!`
            );
            showConfetti(
                last, year.achievements[2], year.achievements[3],
                `confetti_${year.year}_${year.year-1}`,
                `Wow! We beat the last year\'s record!`
            );
            showConfetti(
                last, year.achievements[3], 10000000,
                `confetti_${year.year}_${thousandsString(year.achievements[3])}`,
                `Wow! We fixed ${formatNumber(year.achievements[3])} files!`
            );

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
                    style: {
                        "color": "#FFF",
                        "fontSize": "20px",
                        "fontWeight": "bold",
                        "line-height": "15px",
                        "fontFamily": "Roboto"
                    }
                },
                caption: {
                    text: formatNumber(last),
                    style: {"color": "#000", "fontSize": "16px"},
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

        } else {
            $("#chart-container").html('');
        }
    });

    use(show$, data$, year$, (show, data, year) => {
        if(show === "top5") {
            renderTopFive(data[year.year]);
            $('.table_show_full').text('Show full list');
            $('.table_show_full').off('click');
            $('.table_show_full').on('click', function (e) {
                show$.set("all");
                e.preventDefault();
            });
        } else if (show === 'all') {
            renderAll(data[year.year]);
            $('.table_show_full').text('Collapse list');
            $('.table_show_full').off('click');
            $('.table_show_full').on('click', function (e) {
                show$.set("top5");
                e.preventDefault();
            });
        }
    });

    use(regionalLeaders$, year$, (regionalLeaders, year) => {
        $("#regional_leaders").html('');
        if(regionalLeaders[year.year]) {
            for (var leader of regionalLeaders[year.year]) {
                renderRegion(leader);
            }
        }
    });
})();
