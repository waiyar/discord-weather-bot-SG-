const fetch = require("node-fetch");
const { RichEmbed } = require('discord.js');

const emojis = [
    { weather: "Partly Cloudy (Day)", emojiName: ":white_sun_cloud:" },
    { weather: "Partly Cloudy (Night)", emojiName: ":cloud:" },
    { weather: "Cloudy", emojiName: ":cloud:" },
    { weather: "Showers", emojiName: ":cloud_rain" },
    { weather: "Thundery Showers", emojiName: ":thunder_cloud_rain:" },
];

module.exports = {
    name: 'weather',
    description: "Returns weather forecast for 2 hours",
    args: true,
    usage: '<location>',
    cooldown: 5,
    execute(msg, args) {
        let matchedStation;
        let location = args[0];
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
                        for (let i = 0, len = rainData.length; i < len; i++) {
                            if (rainData[i].station_id === matchedStation.id) {
                                console.log(location + ": ", rainData[i].value);
                                msg.reply(matchedStation.name + "'s Rain: " + rainData[i].value);
                                break loop;
                            }
                        }
                    }
                }
            })
            .catch(err => console.error(err));

        fetch(`https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date_time=${time}`)
            .then(res => res.json())
            .then(data => {
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
                        msg.channel.send(weatherEmbed);
                        // msg.reply("Tag: ", msg.member.user.id);
                    }
                }
            })
            .catch(err => console.error(err));
    }
}