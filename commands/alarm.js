const connection = require('../database.js');

module.exports = {
    name: 'alarm',
    description: "Alerts user when it is raining",
    args: true,
    usage: 'set/clear [area]',
    cooldown: 5,
    execute(msg, args) {
        let [action, ...area] = args;
        area = area.join(' ');
        if (action === "set") {
            let sql = "INSERT INTO `subscriptions` (`userId`, `area`, `weather`) VALUES (?, ?, ?)";
            connection.query(sql, [msg.author.id, area, 'Showers'], (err) => {
                if (err) {
                    console.error(err);
                    return msg.reply("An error occured");
                }
                msg.reply(`I will let you know when it's raining in ${area}!`);
            });
        } else if (action === "clear") {
            let sql = "DELETE FROM `subscriptions` WHERE `userId` = ? AND `area` = ?";
            connection.query(sql, [msg.author.id, area], (err) => {
                if (err) {
                    console.error(err);
                    return msg.reply("An error occured");
                }
                msg.reply(`Your weather-alarm for ${area} has been removed`);
            });
        }
    }
}