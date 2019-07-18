const connection = require('./database.js');
const fetch = require("node-fetch");
const { getPreciseDistance } = require('geolib');
const { RichEmbed } = require('discord.js');

const checkSubs = (users) => {
    let sql = "SELECT * FROM `subscriptions`";
    let subArr = [];
    try {
        connection.query(sql, (err, res) => {
            if (err) throw err;
            if (!res.length) {
                return;
            }
            searchLoop:
            for (let i = 0; i < res.length; i++) {
                if (subArr.length) {
                    for (let j = 0; j < subArr.length; j++) {
                        // If area exists, append to id array instead
                        if (subArr[j].area === res[i].area) {
                            subArr[j].userId.push(res[i].userId);
                            continue searchLoop;
                        }
                    }
                }
                subArr.push({ area: res[i].area, userId: [res[i].userId] });
            }
            setTimeout(checkSubs, 3600000, users);  // Loop every hour
            return checkWeather(subArr, users);
        });
    } catch (e) {
        console.error(e);
    }
}

const checkWeather = (subArr, users) => {
    let now = new Date();
    now.setHours(now.getHours() + 8); // SG time
    now = now.toISOString().slice(0, -5);
    fetch(`https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date_time=${now}`)
        .then(res => res.json())
        .then(data => {
            if (!subArr.length) {
                return;
            }
            for (let i = 0; i < subArr.length; i++) {
                processWeather(data, subArr[i].area, subArr[i], users);
            }
        })
        .catch(err => console.error(err));
}

function processWeather(data, location, subObj, users) {
    let { valid_period, forecasts } = data.items[0];
    for (let i = 0, len = forecasts.length; i < len; i++) {
        if (forecasts[i].area.toLowerCase().includes(location.toLowerCase())) {
            let { start, end } = valid_period;
            start = new Date(start);
            start.setHours(start.getHours() + 8);
            start = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });    // E.g 11:30 AM
            end = new Date(end);
            end.setHours(end.getHours() + 8);
            end = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const { forecast } = forecasts[i];
            if (forecast.includes("Rain") || forecast.includes("Showers")) {
                for (let k = 0; k < subObj.userId.length; k++) {
                    const weatherEmbed = new RichEmbed()
                        .setColor("#38e4ff")
                        .setTitle(`:bangbang: ${forecast} at ${subObj.area} :bangbang:`)
                        .setDescription(`From ${start} to ${end}`)
                        .setFooter(location);
                    users.get(subObj.userId[k]).send(weatherEmbed);
                }
            }
            return;
        } else if (i == len - 1) { // Last of loop, did not match
            fetch(`https://developers.onemap.sg/commonapi/search?searchVal=${location}&returnGeom=Y&getAddrDetails=N&pageNum=1`)
                .then(res => res.json())
                .then(geoData => {
                    const { found, results } = geoData;
                    if (found > 0) {
                        const { LATITUDE: lat, LONGITUDE: lon } = results[0];   // Assuming that the top result is appropriately located
                        const areas = data.area_metadata;
                        let distance = 25000; // 25 km as limit

                        for (let j = 0; j < areas.length; j++) {    // Searches the nearest zone
                            let buff = getPreciseDistance({ lat, lon }, areas[j].label_location);
                            if (buff < distance) {
                                distance = buff;
                                location = areas[j].name;
                            }
                        }
                        return processWeather(data, location, subObj, users);
                    }
                })
                .catch(err => console.error(err));
        }
    }
}
module.exports = { checkSubs };