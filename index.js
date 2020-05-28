const fetch = require('node-fetch');
const Discord = require('discord.js'); const fs = require('fs');
const { MongoClient } = require('mongodb');
const { prefix,
    mainSourceURL, alphaSourceURL, ownerID,
    token, mongodbase, currentdb } = require('./config.json');
const package = require('./package.json');
require('log-timestamp')(function () { return new Date().toLocaleString() + ' "%s"'; });
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const cooldowns = new Discord.Collection();
const settings = { method: "Get" };
let appsList = Array(5);
let dbInstance, welcomechannelID, modRoles, logChannelID,
    oldAltstoreVersion, oldAltstoreBetaVersion, oldAltstoreAlphaVersion,
    oldDeltaVersion, oldDeltaAlphaVersion, oldDeltaBetaVersion,
    announceChannels, betaAnnounceChannels;
const consoles = [`DS games on Delta`, `N64 games on Delta`, `GBA games on Delta`, `GBC games on Delta`, `SNES games on Delta`, `NES games on Delta`];
const versionsQuery = { name: "versions" };

function updateEmbed(color, app, icon, oldversion, newversion, whatsnew) {
    return new Discord.MessageEmbed()
        .setColor(color)
        .setThumbnail(icon)
        .setTitle(`New ${app} update!`)
        .addField("Version:", `${oldversion} -> ${newversion}`, true)
        .addField("What's new:", whatsnew.substring(0, 1024))
        .setTimestamp()
        .setFooter(package.name + ' v. ' + package.version);
}

async function updateVersions() {
    //sets activity to random Delta console
    const randomActivity = consoles[Math.floor(Math.random() * consoles.length)];
    client.user.setActivity(randomActivity + ` with ${client.users.cache.size} others!`, { type: 'PLAYING' });

    // fetch stable/beta altstore repo
    const res1 = await fetch(mainSourceURL);
    const res2 = await fetch(alphaSourceURL);
    const altstore = await res1.json();
    const alphaAltstore = await res2.json();
    if (!(Object.keys(altstore).includes('apps')
        && typeof altstore.apps === 'object'
        && altstore.apps instanceof Array)) throw "No apps array in altstore repo";
    if (!(Object.keys(alphaAltstore).includes('apps')
        && typeof alphaAltstore.apps === 'object'
        && alphaAltstore.apps instanceof Array)) throw "No apps array in altstore alpha repo";

    const newAltstore = altstore.apps.find(app => app.bundleIdentifier == "com.rileytestut.AltStore");
    const newDelta = altstore.apps.find(app => app.bundleIdentifier == "com.rileytestut.Delta");

    const newAltstoreBeta = altstore.apps.find(app => app.bundleIdentifier == "com.rileytestut.AltStore.Beta");
    const newDeltaBeta = altstore.apps.find(app => app.bundleIdentifier == "com.rileytestut.Delta.Beta");

    const newAltstoreAlpha = alphaAltstore.apps.find(app => app.bundleIdentifier == "com.rileytestut.AltStore.Alpha");
    const newDeltaAlpha = alphaAltstore.apps.find(app => app.bundleIdentifier == "com.rileytestut.Delta.Alpha");

    if (false // If statement only connects to the database and checks in depth for updates and sends messages *if there is at least one update* (false statement so the other lines are symmetrical)
        || newAltstore.version !== oldAltstoreVersion
        || newAltstoreBeta.version !== oldAltstoreBetaVersion
        || newAltstoreAlpha.version !== oldAltstoreAlphaVersion
        || newDelta.version !== oldDeltaVersion
        || newDeltaBeta.version !== oldDeltaBetaVersion
        || newDeltaAlpha.version !== oldDeltaAlphaVersion
    ) {
        MongoClient.connect(mongodbase, { useUnifiedTopology: true }, (err, db) => {
            if (err) throw err;
            dbInstance = db.db(currentdb);
            newDelta.version = "1.0" //testing
            // newAltstore.version = "1.0" //testing
            // newAltstoreBeta.version = "4.0" //testing
            // newDeltaBeta.version = "3.0" //testing

            // AltStore
            if (newAltstore.version !== oldAltstoreVersion) {
                appsList[0] = newAltstore.version;
                const newvalue = { $set: { apps: appsList } };
                dbInstance.collection("data").updateOne(versionsQuery, newvalue, (err, res) => {
                    if (err) throw err;
                    const modEmbed = updateEmbed("#018084", "AltStore", newAltstore.iconURL, oldAltstoreVersion, newAltstore.version, newAltstore.versionDescription);
                    for (const chan of announceChannels)
                        chan.send(modEmbed);
                });
            }

            // AltStore Beta
            if (newAltstoreBeta.version !== oldAltstoreBetaVersion) {
                appsList[2] = newAltstoreBeta.version;
                const newvalue = { $set: { apps: appsList } };
                dbInstance.collection("data").updateOne(versionsQuery, newvalue, (err, res) => {
                    if (err) throw err;
                    const modEmbed = updateEmbed("#018084", "AltStore Beta", newAltstoreBeta.iconURL, oldAltstoreBetaVersion, newAltstoreBeta.version, newAltstoreBeta.versionDescription);
                    for (const chan of betaAnnounceChannels)
                        chan.send(modEmbed);
                });
            }

            // AltStore Alpha
            if (newAltstoreAlpha.version !== oldAltstoreAlphaVersion) {
                appsList[4] = newAltstoreAlpha.version;
                const newvalue = { $set: { apps: appsList } };
                dbInstance.collection("data").updateOne(versionsQuery, newvalue, (err, res) => {
                    if (err) throw err;
                    const modEmbed = updateEmbed("#018084", "AltStore Alpha", newAltstoreAlpha.iconURL, oldAltstoreAlphaVersion, newAltstoreAlpha.version, newAltstoreAlpha.versionDescription);
                    for (const chan of betaAnnounceChannels)
                        chan.send(modEmbed);
                });
            }

            // Delta
            if (newDelta.version !== oldDeltaVersion) {
                appsList[1] = newDelta.version;
                const newvalue = { $set: { apps: appsList } };
                dbInstance.collection("data").updateOne(versionsQuery, newvalue, function (err, res) {
                    if (err) throw err;
                    const modEmbed = updateEmbed("#8A28F7", "Delta", newDelta.iconURL, oldDeltaVersion, newDelta.version, newDelta.versionDescription);
                    for (const chan of announceChannels)
                        chan.send(modEmbed);

                });
            }

            // Delta Beta
            if (newDeltaBeta.version !== oldDeltaBetaVersion) {
                appsList[3] = newDeltaBeta.version;
                const newvalue = { $set: { apps: appsList } };
                dbInstance.collection("data").updateOne(versionsQuery, newvalue, function (err, res) {
                    if (err) throw err;
                    const modEmbed = updateEmbed("#8A28F7", "Delta Beta", newDeltaBeta.iconURL, oldDeltaBetaVersion, newDeltaBeta.version, newDelta.versionDescription);
                    for (const chan of betaAnnounceChannels)
                        chan.send(modEmbed);

                });
            }

            // Delta Alpha
            if (newDeltaAlpha.version !== oldDeltaAlphaVersion) {
                appsList[5] = newDeltaAlpha.version;
                const newvalue = { $set: { apps: appsList } };
                dbInstance.collection("data").updateOne(versionsQuery, newvalue, function (err, res) {
                    if (err) throw err;
                    const modEmbed = updateEmbed("#8A28F7", "Delta Alpha", newDeltaAlpha.iconURL, oldAltstoreAlphaVersion, newDeltaBeta.version, newDelta.versionDescription);
                    for (const chan of betaAnnounceChannels)
                        chan.send(modEmbed);

                });
            }
        });
        updateVars();
    }
};
function updateVars() {
    // Prevent errors on launch by awaiting the finish of this before initially using updateVersions()
    return new Promise((resolve, reject) => MongoClient.connect(mongodbase, { useUnifiedTopology: true }, async function (err, db) {
        if (err) return reject(err);
        dbInstance = db.db(currentdb);
        const dataItems = await dbInstance.collection('data').findOne({});
        appsList = dataItems.apps;
        //appsList 0-altstore, 1-delta, 2-beta altstore, 3-beta delta, 4-alpha altstore, 5-alpha delta
        oldAltstoreVersion = appsList[0];
        oldDeltaVersion = appsList[1];
        oldAltstoreBetaVersion = appsList[2];
        oldDeltaBetaVersion = appsList[3];
        oldAltstoreAlphaVersion = appsList[4];
        oldDeltaAlphaVersion = appsList[5];
        const items = await dbInstance.collection('config').findOne({});
        // prefix = items.prefix;
        welcomechannelID = items.welcomechannel;
        modRoles = items.modroles;
        logChannelID = items.logchannel;
        announceChannels = items.announcechannel.map(element => client.channels.cache.get(element));
        betaAnnounceChannels = items.betaannouncechannel.map(element => client.channels.cache.get(element));
        resolve();
    }));
}

async function fillAppsList() {
    const rawmain = await fetch(mainSourceURL);
    const rawalpha = await fetch(alphaSourceURL);
    const main = await rawmain.json()
    const alpha = await rawalpha.json()
    if (!(Object.keys(main).includes('apps')
        && typeof main.apps === 'object'
        && main.apps instanceof Array)) throw "No apps array in altstore repo";
    if (!(Object.keys(alpha).includes('apps')
        && typeof alpha.apps === 'object'
        && alpha.apps instanceof Array)) throw "No apps array in altstore alpha repo";


    appsList[0] = main.apps.find(app => app.bundleIdentifier == "com.rileytestut.AltStore");
    appsList[1] = main.apps.find(app => app.bundleIdentifier == "com.rileytestut.Delta");

    appsList[2] = main.apps.find(app => app.bundleIdentifier == "com.rileytestut.AltStore.Beta");
    appsList[3] = main.apps.find(app => app.bundleIdentifier == "com.rileytestut.Delta.Beta");

    appsList[4] = alpha.apps.find(app => app.bundleIdentifier == "com.rileytestut.Delta.Alpha");
    appsList[5] = alpha.apps.find(app => app.bundleIdentifier == "com.rileytestut.AltStore.Alpha");
}

function exeCommand(command, message, args) {
    if (command.needsclient) {
        command.execute(message, args, client);
    } else {
        command.execute(message, args);
    }
    if (command.updatedb) {
        updateVars();
    }
}

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}

client.once('ready', async () => {
    try {
        await updateVars();
        await fillAppsList();
    } catch (e) { console.error(e); }
    setInterval(updateVersions, 60 * 1000);
    console.log('Ready!');
});

client.on('message', message => {
    if (!(message.content.startsWith(prefix) || message.mentions.users.first() == client.user) || message.author.bot) return;
    var args;
    if (message.content.startsWith(prefix)) {
        args = message.content.slice(prefix.length).split(/ +/);
    } else {
        args = message.content.slice(prefix.length).split(/ +/).slice(1);
    }
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
        if (command.guildOnly && message.channel.type !== 'text') {
            return message.reply('I can\'t execute that command inside DMs!');
        }
        if (command.args && !args.length) {
            const commandhelp = client.commands.get("help");
            const argshelp = [command.name];
            commandhelp.execute(message, argshelp);
        } else {
            let hasPerms = message.author.id === ownerID;
            if (command.needsmod) {
                hasPerms = hasPerms
                    || message.member.hasPermission("ADMINISTRATOR")
                    || modRoles.some(role => message.member.roles.cache.has(role));
                if (!isMod) {
                    message.channel.send("You need to be mod to use this command.");
                    return;
                } else {
                    exeCommand(command, message, args);
                }
            } else if (command.needsadmin) {
                hasPerms = hasPerms
                    || message.member.hasPermission("ADMINISTRATOR");
                if (hasPerms) {
                    exeCommand(command, message, args);
                    return;
                } else {
                    message.channel.send("You need to be admin to use this command.");
                }
            } else if (command.needsowner) {
                if (hasPerms) {
                    exeCommand(command, message, args);
                    return;
                } else {
                    message.channel.send(":rage:");
                }
            } else {
                exeCommand(command, message, args);
            }
        }
    }

    catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});

//Join message
client.on('guildMemberAdd', member => {
    const channel = [
        "625766896230334465", // AltStore Discord
        "625714187078860810", // Delta Discord
    ].includes(member.guild.id) ? channel = member.guild.channels.cache.get(welcomechannelID) : null;
    // Do nothing if the channel wasn't found on this server
    if (!channel) return;

    // Send the message, mentioning the member
    channel.send(`Welcome to the server, ${member}! Please read the info below.`);
    const modEmbed = new Discord.MessageEmbed()
        .setColor('#32CD32')
        .setTitle("Member Joined");
    channel.send(modEmbed);
});

//Deleted message
client.on('messageDelete', message => {
    if (message.channel.type === 'dm') return;
    let logchannel = message.guild.channels.cache.get(logChannelID);
    if (!logchannel) return;

    const modEmbed = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setAuthor(message.author.tag, message.author.avatarURL())
        .addField("Message deleted:", message.content)
        .addField("Channel:", message.channel)
        .setTimestamp()
        .setFooter(`Sender ID: ${message.author.id}`);
    logchannel.send(modEmbed);
});

//edited message
client.on('messageUpdate', function (oldMessage, newMessage) {
    if (oldMessage.channel.type === 'dm') return;
    if (oldMessage.content.length && newMessage.content.length) {
        let logchannel = newMessage.guild.channels.cache.get(logChannelID);
        if (!logchannel) return;

        const modEmbed = new Discord.MessageEmbed()
            .setColor('#ffff00')
            .setAuthor(newMessage.author.tag, newMessage.author.avatarURL())
            .setDescription(`Message edited in ${newMessage.channel} [Jump to message](${newMessage.url})`)
            .addField("Before:", oldMessage.content, true)
            .addField("After:", newMessage.content, true)
            .setTimestamp()
            .setFooter(`Sender ID: ${newMessage.author.id}`);
        logchannel.send(modEmbed);
    }
});

//banned member
client.on('guildBanAdd', async function (guild, user) {
    let logchannel = guild.channels.cache.get(logChannelID);
    const banList = await guild.fetchBan(user.id);
    if (!logchannel) return;

    const modEmbed = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setTitle("Ban")
        .addField("User banned:", user.tag, true)
        .addField("Reason:", banList.reason, true)
        .setTimestamp()
        .setFooter(`User ID: ${user.id}`);
    logchannel.send(modEmbed);
});

//leave log
client.on('guildMemberRemove', member => {
    // Send the message to a designated channel on a server:
    let logchannel = member.guild.channels.cache.get(logChannelID);
    // Do nothing if the channel wasn't found on this server
    if (!logchannel) return;
    if (!member.bannable) return;
    // Send the message, mentioning the member
    const modEmbed = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setTitle("Member Left")
        .setAuthor(member.user.tag, member.user.avatarURL())
        .addField("Left at:", member.joinedAt.toDateString() + ", " + member.joinedAt.toLocaleTimeString('en-US'))
        .setTimestamp()
        .setFooter(`User ID: ${member.user.id}`);
    logchannel.send(modEmbed);
});

//unbanned member
client.on('guildBanRemove', async function (guild, user) {
    let logchannel = guild.channels.cache.get(logChannelID);
    if (!logchannel) return;

    guild.fetchAuditLogs()
        .then(audit => {
            const modEmbed = new Discord.MessageEmbed()
                .setColor('#32CD32')
                .setTitle("Unban")
                .addField("User unbanned:", user.tag, true)
                .addField("Reason:", audit.entries.first().reason, true)
                .setTimestamp()
                .setFooter(`User ID: ${user.id}`);
            logchannel.send(modEmbed);
        });
});

//deleted channel
client.on('channelDelete', channel => {
    if (channel.type === 'dm') return;
    let logchannel = channel.guild.channels.cache.get(logChannelID);
    if (!logchannel) return;

    channel.guild.fetchAuditLogs()
        .then(audit => {
            const modEmbed = new Discord.MessageEmbed()
                .setColor('#ff0000')
                .setTitle("Channel Deleted")
                .addField("Channel:", channel.name, true)
                .addField("Category:", channel.parent, true)
                .addField("User:", audit.entries.first().executor, true)
                .setTimestamp();
            logchannel.send(modEmbed);
        });
});

client.login(token);