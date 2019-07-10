const connection = require('../database.js');

module.exports = {
    name: 'alarms',
    description: "View all alarms user has subscribed to",
    cooldown: 5,
    execute(msg) {
        let sql = "SELECT * FROM `subscriptions` WHERE `userId` = " + msg.author.id;
        connection.query(sql, (err, res) => {
            if (err) console.error(err);
            if (!res.length) {
                msg.reply(`There are no alarms set.`);
                return;
            }
            for(let i = 0; i < res.length; i++) {
                msg.reply(`Location: ${res[i].area}`);
            }
        });
    }
}