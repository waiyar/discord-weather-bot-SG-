const { Client, RichEmbed } = require('discord.js');
const client = new Client();
const auth = require('./auth.json');
const fetch = require("node-fetch");

const reqWeather = "weather", reqHelp = "help";

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("message", msg => {
    if (!msg.content[0] === "@") return;
    if (msg.content.includes(reqWeather)) {
        let location = msg.content.slice(reqWeather.length + 1).trim();
        if (location.length < 4) {
            msg.reply('Invalid location');
            return;
        }
        let time = msg.createdAt;
        time.setHours(time.getHours() + 8); // SG time
        time = time.toISOString().slice(0, -5);

        console.log("Msg time: ", time, ", Location: ", location);
        getWeather(msg, location, time);
        
    } else if (msg.content.includes(reqHelp)) {
        const embed = new RichEmbed()
            .setTitle('Weather Bot(WIP)')
            .setColor('#5e2be0')
            .setDescription('Use @weather followed by a location. E.g. @weather yishun');
        msg.channel.send(embed);
    }
});

function getWeather(msg, location, time) {
    let matchedStation;

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
                    msg.reply(`Weather forecast from ${valid_period.start} to ${valid_period.end}
                        \n${forecasts[i].forecast}`);
                    console.log(valid_period.start);
                }
            }
        })
        .catch(err => console.err(err));
}

client.login(auth.token);