
import { Client, MessageEmbed, Message } from "discord.js";
import disbut, { MessageComponent } from "discord-buttons";
import { Card, Hand, GameState, Game } from "./model";

// setup
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client:Client = new Client();
disbut(client);

const games:Game[] = [];

client.on("ready", () => console.log(`TS Logged in as ${client!.user!.tag}.`));

client.on("message", async (msg) => {

  // message = 'ping' and channel = DM
  // the bot will start a game
  if (msg.content.toLocaleLowerCase() === 'ping' &&
    (msg.channel as any).name === undefined) {

    const gameState = new GameState (
      new Hand(Card.getRandom(false), Card.getRandom(true)),
      new Hand(Card.getRandom(false), Card.getRandom(false))
    );

    // msg.reply(gameState.getMessage());
    let m:Message = await msg.reply(gameState.getMessage());
    games.push({ message: m, gameState: gameState });
  }

  // message = 'hi' and channel = TextChannel(👾-bot-testing)
  // the bot will DM you
  else if(msg.content.toLocaleLowerCase() === "hi"
    && (msg.channel as any).name === "👾-bot-testing") {

    const message = new MessageEmbed()
      .setColor("#fcba03")
      .setTitle("Welcome to BlackJack")
      .setDescription('Here are the rules.')
      .addField("Rule #1", "This is the rule number one", false)
      .addField("Rule #2", "This is the rule number two", false)
      .addField("Rule #3", "This is the rule number three", false)
      .addField("About Developer", "[@CaptainAyan](https://captainayan.github.io)", false)
      .setFooter("Powered By Heroku");

    msg.author.send(message); // message in DM
    msg.reply("Check your DM 😊"); // message in the channel
  }
})

client.on("clickButton", async (m:MessageComponent) => {

  console.log("Click");
  // await m.clicker.fetch();
  m.think();

  games.map((game) => {
    if(game.message.id == m.message.id) {
      if(m.id === "hit") game.gameState.hit();
      if(m.id === "stand") game.gameState.stand();
      m.message.edit(game.gameState.getMessage());
    }
  });

  m.defer(false);
})

client.login(process.env.DISCORD_KEY);