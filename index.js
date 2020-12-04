const Discord = require('discord.js')
const client = new Discord.Client()
const fs = require('fs');
const Enmap = require('enmap');

const prefix = "!";
const token = require('./config.json');
client.login(token.token);

client.on('ready', () => {
    client.user.setStatus('dnd')
    let serveur = client.guilds.size;
    let membre = client.users.size; ///j'ai défini des valeur pour faire jolie

    const statbot = [

        `V1 | © Shop`,
        `Use !help`,
        `Developed by © Rolyz`

    ];

    setInterval(function() {

        const statutID = Math.floor(Math.random() * Math.floor(statbot.length)); /// ici j'ai choisi que sa met au hasard
        client.user.setActivity(statbot[statutID]);
    }, 30000);

});

client.commands = new Enmap();

fs.readdir("./Commands/", (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
        if (!file.endsWith(".js")) return;
        let props = require(`./Commands/${file}`);
        let commandName = file.split(".")[0];
        console.log(`[ LOADING ] [ COMMANDES ] ${commandName}`);
        client.commands.set(commandName, props);
    });
});

const verifyj = JSON.parse(fs.readFileSync("./verify.json", "utf8"))

client.on('message', async message => {
    let messageArray = message.content.split(" ");
    if (message.content === `${prefix}setcaptcha`) {

        let filter = m => m.author.id === message.author.id;
        let ch;
        if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Vous n'avez pas la permission `ADMINISTRATOR` pour éxecuter cette commande !").then(msg => {
            msg.delete(4500);
            message.delete(4500);
        });

        message.channel.send(':pencil: **| Merci de marquer le nom du salon.. :pencil2: **').then(msg => {

            message.channel.awaitMessages(filter, {
                    max: 1,
                    time: 90000,
                    errors: ['time']
                })
                .then(collected => {
                    collected.first().delete();
                    ch = collected.first().content;
                    let chf = message.guild.channels.find('name', `${ch}`)
                    if (!chf) return msg.edit("Le salon n'a pas été trouvé, merci de refaire ``L,setcaptcha``") && console.log('cant find this channel')
                    let rr;
                    msg.edit(':scroll: **| Merci de marquer le nom du rôle :pencil2: **').then(msg => {

                        message.channel.awaitMessages(filter, {
                                max: 1,
                                time: 90000,
                                errors: ['time']
                            })
                            .then(collected => {
                                collected.first().delete();
                                rr = collected.first().content;
                                let rf = message.guild.roles.find('name', `${rr}`)
                                if (!rf) return msg.edit("Le salon n'a pas été trouvé, merci de refaire ``L,setcaptcha``") && console.log('cant find this role')
                                msg.edit('Configuration éffectué !').then(msg => {

                                    message.channel.awaitMessages(filter, {
                                        max: 1,
                                        time: 90000,
                                        errors: ['time']
                                    })
                                    let embed = new Discord.RichEmbed()
                                        .setAuthor('Setcaptcha')
                                        .addField('Salon du captcha:', `${ch}`)
                                        .addField('Rôle vérifié:', `${rr}`)
                                        .setFooter("Developed by © Rolyz", "https://i.imgur.com/wNWDzWN.jpg")
                                    message.channel.sendEmbed(embed)
                                    verifyj[message.guild.id] = {
                                        channel: ch,
                                        rolev: rr,
                                        onoff: 'On'
                                    }
                                    fs.writeFile("./verify.json", JSON.stringify(verifyj), (err) => {
                                        if (err) console.error(err)
                                    })
                                })
                            })
                    })
                })
        })
    }
});

client.on('message', async message => {

    if (message.content == `${prefix}captcha off`) {
        if (!verifyj[message.guild.id]) verifyj[message.guild.id] = {
            channel: "Undefined",
            onoff: "Off",
            rolev: "Undefined"
        }
        if (verifyj[message.guild.id].onoff === "Off") return message.channel.send("Le captcha est déjà désactivé !")
        verifyj[message.guild.id].onoff = "off"
        message.channel.send('Captcha désactivé !')
        fs.writeFile("./verify.json", JSON.stringify(verifyj), (err) => {
            if (err) console.error(err)
        })
    }
});


client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.channel.type === 'dm') return;
    let rf = message.guild.roles.find('name', `${verifyj[message.guild.id].rolev}`)
    let mem = message.guild.member(message.author)
    if (message.content.startsWith(prefix + 'captcha')) {
        if (!verifyj[message.guild.id]) verifyj[message.guild.id] = {
            channel: "Undefined",
            onoff: "Off",
            rolev: "Undefined"
        }
        if (verifyj[message.guild.id].onoff === "Off") return console.log("Le captcha est désactivé !")
        if (message.channel.name !== verifyj[message.guild.id].channel) return console.log('wrong channel')
        if (mem.roles.has(rf.id)) return message.channel.send("Vous êtes déjà vérifié !")
        const type = require('./verifycodes.json');
        const item = type[Math.floor(Math.random() * type.length)];
        const filter = response => {
            return item.answers.some(answer => answer.toLowerCase() === response.content.toLowerCase());
        };
        const embed = new Discord.RichEmbed()
            .setTitle("Merci d'écrire ce code dans les 15 secondes.")
            .setColor("#FFFFFF")
            .setImage(`${item.type}`)
            .setFooter("Developed by © Rolyz", "https://i.imgur.com/wNWDzWN.jpg")
        message.channel.sendEmbed(embed).then(() => {
            message.channel.awaitMessages(filter, { maxMatches: 1, time: 15000, errors: ['time'] })
                .then((collected) => {
                    message.author.send(`${collected.first().author} Vous venez d'être verifié !`);
                    message.channel.send(`${collected.first().author} Vous venez d'être vérifié !`);
                    console.log(`[Typing] ${collected.first().author} verfied himself ! .`);
                    message.guild.member(collected.first().author).addRole(rf)
                })
                .catch(collected => {
                    message.author.send('Timeout !')
                    console.log('[Typing] Error: No one type the captcha code.');
                    console.log(collected)

                })

            fs.writeFile("./verify.json", JSON.stringify(verifyj), (err) => {
                if (err) console.error(err)
            })
        })
    }
});