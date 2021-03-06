var MongoClient = require('mongodb').MongoClient;
const { mongodbase, currentdb } = require('../config.json');
module.exports = {
	name: 'daily',
	description: 'Gets daily credits.',
	guildOnly: true,
	execute(message, args) {
		MongoClient.connect(mongodbase, { useUnifiedTopology: true }, async function (err, db) {
			if (err) throw err;
			dbInstance = db.db(currentdb);
			const user = await dbInstance.collection("users").findOne({ id: message.author.id });
			if (user == null) {
				var myobj = { id: message.author.id, balance: 1000, dailytime: Date.now() };
				dbInstance.collection("users").insertOne(myobj, function (err, res) {
					if (err) throw err;
					message.reply(`account created. \`1000\` credits were added to your balance.`)
					db.close();
				});
			} else {
				const oneday = 60 * 60 * 24 * 1000
				if ((Date.now() - user.dailytime) > oneday) {
					let newbalance = user.balance + 1000;
					const myobj = { id: message.author.id };
					const newvalues = { $set: { id: message.author.id, balance: newbalance, dailytime: Date.now() } };
					dbInstance.collection("users").updateOne(myobj, newvalues, function (err, res) {
						if (err) throw err;
						message.reply(`daily credits redeemed. \`1000\` credits have been added to your account. Your new balance is \`${newbalance}\``)
					});
				} else {
					message.reply(`you need to wait another ${Math.floor((oneday - (Date.now() - user.dailytime) / (1000 * 60 * 60)) % 24)} hours before collecting your daily credits.`)
				}
				db.close();
			}
		});
	},
};