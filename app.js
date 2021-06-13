const Discord = require('discord.js');
const disbut = require('discord-buttons');
const {Card, Hand, GameState} = require('./model');

// setup
require('dotenv').config({ path: './.env' });
const client = new Discord.Client();
disbut(client);

client.on('ready', _ => console.log(`Logged in as ${client.user.tag}!`));

client.on('message', async msg => {
  if (msg.content.toLocaleLowerCase() === 'ping' &&
    msg.channel.name === undefined) { // the second part makes sure that it's a direct message

    /* const gameState = new GameState ( // for testing
      new Hand(new Card(Card.Suit[0], Card.Rank[8], false), new Card(Card.Suit[0], Card.Rank[9], true)),
      new Hand(new Card(Card.Suit[0], Card.Rank[0], false), new Card(Card.Suit[0], Card.Rank[9], false))
    ); */

    const gameState = new GameState (
      new Hand(Card.getRandom(false), Card.getRandom(true)),
      new Hand(Card.getRandom(false), Card.getRandom(false))
    );

    var m = await msg.reply(gameState.getMessage());

    const collector = m.createButtonCollector(btn =>
      btn.clicker.user.id === msg.author.id);

    collector.on("collect", (b) => {
      if (b.id == "hit") gameState.hit();
      if (b.id == "stand") gameState.stand();
      m.edit(gameState.getMessage());
      b.defer();
    })
  }

  if(msg.content.toLocaleLowerCase() === 'hi' &&
    msg.channel.name === '👾-bot-testing') {

    const message = new Discord.MessageEmbed()
      .setColor("#fcba03")
      .setTitle("Welcome to BlackJack")
      .setDescription('Here are the rules.')
      .addField("Rule #1", "This is the rule number one", false)
      .addField("Rule #2", "This is the rule number two", false)
      .addField("Rule #3", "This is the rule number three", false)
      .addField("About Developer", "[@CaptainAyan](https://captainayan.github.io)", false)
      .setFooter("Powered By Heroku");

    msg.author.send(message);
    msg.reply("Check your DM 😊");
  }
});

client.login(process.env.DISCORD_KEY);
