const connection = require('./database.js');
const { getForecast } = require('./commands/weather.js');
const fetch = require("node-fetch");

// Check table for queries every 5 minutes
const checkSubs = () => {
    let sql = "SELECT * FROM `subscriptions`";
    let subArr = [];
    connection.query(sql, (err, res) => {
        if (err) console.error(err);
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
        console.log(subArr);
        return checkWeather(subArr);
    });
}

const checkWeather = (subArr) => {
    let now = new Date();
    now.setHours(now.getHours() + 8); // SG time
    now = now.toISOString().slice(0, -5);

    let msg = { 
        channel: {
            test: [],
            send(embedMsg) {
                this.test.push({area: "", weatherEmbed: embedMsg});
            } 
        } 
    };
    fetch(`https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date_time=${now}`)
        .then(res => res.json())
        .then(data => {
            if(!subArr.length) {
                return;
            }
            for (let i = 0; i < subArr.length; i++) {
                getForecast(data, subArr[i].area, msg);
                // msg.channel.test[i].area = subArr[i].area;
            }
            console.log(msg.channel.test);
        })
        .catch(err => console.error(err));
}
module.exports = { checkSubs };