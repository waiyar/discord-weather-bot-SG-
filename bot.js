#! /usr/bin/env node
const fs = require('fs');
const { Client, Collection } = require('discord.js');
const { prefix, token } = require('./config.json');
const { checkSubs } = require('./alarmSystem.js');

const client = new Client();
client.commands = new Collection();

const commandFiles = fs.readdirSync(require('path').resolve(__dirname, './commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

const cooldowns = new Collection();

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    checkSubs(client.users);
});

client.on("message", msg => {
    if (!msg.content.startsWith(prefix) || msg.author.bot) return;

    const args = msg.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) return;
    const command = client.commands.get(commandName);

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${msg.author}!`;

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }

        return msg.channel.send(reply);
    }

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(msg.author.id)) {
        const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return msg.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }

    timestamps.set(msg.author.id, now);
    setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);

    try {
        command.execute(msg, args);
    } catch (err) {
        console.error(err);
        msg.reply("An error occured!");
    }
});

client.on('error', err => console.log("discordjs Error: ", err));
client.on('disconnect', event => console.log("discordjs Disconnect: ", event));

client.login(token);