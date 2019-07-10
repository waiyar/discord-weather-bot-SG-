const fetch = require("node-fetch");
const { RichEmbed } = require('discord.js');
const { getPreciseDistance } = require('geolib');

const emojis = [
    { weather: "Fair (Day)", emojiName: ":sunny:" },
    { weather: "Partly Cloudy (Day)", emojiName: ":white_sun_cloud:" },
    { weather: "Partly Cloudy (Night)", emojiName: ":cloud:" },
    { weather: "Cloudy", emojiName: ":cloud:" },
    { weather: "Light Rain", emojiName: ":white_sun_rain_cloud:" },
    { weather: "Showers", emojiName: ":cloud_rain:" },
    { weather: "Thundery Showers", emojiName: ":thunder_cloud_rain:" },
    { weather: "Heavy Thundery Showers with Gusty Winds", emojiName: ":thunder_cloud_rain::dash:" }
];

module.exports = {
    name: 'weather',
    description: "Returns weather forecast for 2 hours",
    args: true,
    usage: '[location]',
    cooldown: 5,
    execute(msg, args) {
        let matchedStation;
        let location = args.join(' ');
        if (location.length < 4) {  // Temporary solution to avoid too many results
            msg.reply('Invalid location');
            return;
        }
        let time = msg.createdAt;
        time.setHours(time.getHours() + 8); // SG time
        time = time.toISOString().slice(0, -5);

        fetch(`https://api.data.gov.sg/v1/environment/rainfall?date_time=${time}`)
            .then(res => res.json())
            .then(data => {
                let allStations = data.metadata.stations;
                let rainData = data.items[0].readings;

                for (let i = 0, len = allStations.length; i < len; i++) {
                    if (allStations[i].name.toLowerCase().includes(location.toLowerCase())) {
                        matchedStation = allStations[i];
                        console.log("Station Id: ", matchedStation.id);
                        loop:
                        for (let j = 0, len = rainData.length; j < len; j++) {
                            if (rainData[j].station_id === matchedStation.id) {
                                console.log(location + ": ", rainData[j].value);
                                msg.reply(`${matchedStation.name}'s Rain: ${rainData[j].value}mm`);
                                break loop;
                            }
                        }
                    }
                }
            })
            .catch(err => console.error(err));

        fetch(`https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date_time=${time}`)
            .then(res => res.json())
            .then(data => this.getForecast(data, location, msg))
            .catch(err => console.error(err));
    },
    getForecast(data, location, msg) {
        let { valid_period, forecasts } = data.items[0];
        for (let i = 0, len = forecasts.length; i < len; i++) {
            if (forecasts[i].area.toLowerCase().includes(location.toLowerCase())) {
                let { start, end } = valid_period;
                start = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });    // E.g 11:30 AM
                end = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const { area, forecast } = forecasts[i];
                const weatherEmbed = new RichEmbed()
                    .setColor("#38e4ff")
                    .setTitle(`${forecast} ${emojis.find(e => e.weather === forecast).emojiName}`)
                    .setDescription(`From ${start} to ${end}`)
                    .setFooter(area);
                return msg.channel.send(weatherEmbed);
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
                            return this.getForecast(data, location, msg);
                        }
                    })
                    .catch(err => console.error(err));
            }
        }
    }
}

/* function getForecast(data, location, msg) {
    let { valid_period, forecasts } = data.items[0];
    for (let i = 0, len = forecasts.length; i < len; i++) {
        if (forecasts[i].area.toLowerCase().includes(location.toLowerCase())) {
            let { start, end } = valid_period;
            start = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });    // E.g 11:30 AM
            end = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const { area, forecast } = forecasts[i];
            const weatherEmbed = new RichEmbed()
                .setColor("#38e4ff")
                .setTitle(`${forecast} ${emojis.find(e => e.weather === forecast).emojiName}`)
                .setDescription(`From ${start} to ${end}`)
                .setFooter(area);
            return msg.channel.send(weatherEmbed);
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
                        return getForecast(data, location, msg);
                    }
                })
        }
    }
} */