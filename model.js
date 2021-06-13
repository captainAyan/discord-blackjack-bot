const Discord = require('discord.js');
const disbut = require('discord-buttons');

class Card {
  constructor(_suit, _rank, _isHidden) {
    this.suit = _suit;
    this.rank = _rank;
    this.isAce = (_rank.label=="A" ? true : false);
    this.isHidden = _isHidden;
  }

  print() {
    var x = "";
    if (!this.isHidden) {
      x += "**" + this.rank.label + "** ";
      x += this.suit.label;
    }
    else x += "🔒";
    return x;
  }

  static Rank = [
    {label: "A", value:11}, // this will be adjusted later
    {label: "2", value:2},
    {label: "3", value:3},
    {label: "4", value:4},
    {label: "5", value:5},
    {label: "6", value:6},
    {label: "7", value:7},
    {label: "8", value:8},
    {label: "9", value:9},
    {label: "10", value:10},
    {label: "J", value:10},
    {label: "Q", value:10},
    {label: "K", value:10}
  ];

  static Suit = [
    {name: "Spade", label:"♤"},
    {name: "Heart", label:"♡"},
    {name: "Club", label:"♧"},
    {name: "Diamond", label:"♢"}
  ];

  static getRandom(isHidden) {
    var rank = Card.Rank[Math.floor((Math.random() * 12) + 0)]; // value between 0 -> 12
    var suit = Card.Suit[Math.floor((Math.random() * 3) + 0)]; // value between 0 -> 3
    return new Card(suit, rank, isHidden)
  }
}

class Hand {
  constructor (_card0, _card1) {
    this.cards = [_card0, _card1];
  }

  getValue() {
    var total = 0;
    var aceStack = [];
    for (const card of this.cards) {
      if (card.isAce) aceStack.push(card);
      total += card.rank.value;
    }

		if (total > 21) { // this is for dynamically changing the value of Ace Card
			for (const i in aceStack) {
        total -= 10;
        if (total <= 21) return total;
      }
    }
    return total;
  }

  print() {
    var doShowValue = true; // if false, the value of hand won't be displayed
    var x = this.cards[0].print();
    for(var i=1; i<this.cards.length; i++) {
      x += " - ";
      x += this.cards[i].print();

      if(this.cards[i].isHidden) doShowValue = false;
    }
    if (doShowValue) x += " ("+this.getValue()+")";
    else x += " (xx)";
    return x;
  }
}

class GameState {
  constructor (_dealerHand, _playerHand) {
    this.dealerHand = _dealerHand;
    this.playerHand = _playerHand;

    // 1 means won, -1 means lost, 2 means tie, 3 means blackjack, and 0 default
    this.win = 0;

    this.actionButtonHit = new disbut.MessageButton()
      .setEmoji("🚀")
      .setStyle("green")
      .setID("hit");

    this.actionButtonStand = new disbut.MessageButton()
      .setEmoji("✨")
      .setStyle("blurple")
      .setID("stand");

    // check for player blackjack
    if(this.playerHand.getValue() == 21) this.win=3;
  }

  /**
   * @returns Discord.MessageEmbed
   */
  getEmbed() {
    const message = new Discord.MessageEmbed()
      .setColor("#fcba03")
      .setTitle("BlackJack")
      .setDescription('You have started a BlackJack Game')
      .addField("Dealer Hand", this.dealerHand.print() , true)
      .addField("Player Hand", this.playerHand.print() , true)
      .setFooter("Response within 5 minutes.");

    // game over checker
    if(this.win !== 0) {
      this.actionButtonHit.setDisabled(true);
      this.actionButtonStand.setDisabled(true);
    }

    // Image for win, lose, and tie
    if(this.win == 1) {
      message.setImage('https://media.giphy.com/media/J5Ye3xSZk4CfAL12dX/giphy.gif');
    }else if(this.win == -1) {
      message.setImage('https://media.giphy.com/media/Y4z9olnoVl5QI/giphy.gif');
    }else if(this.win == 2) {
      message.setImage('https://media.giphy.com/media/xT3i0P4CYQcdmFZQkM/giphy.gif');
    }else if(this.win == 3) {
      message.setImage('https://media.giphy.com/media/cjPFESwD0lu7M9tCO2/giphy.gif');
    }

    return message;
  }

  /**
   * @returns disbut.MessageButton[]
   */
  getButtons() {
    return [this.actionButtonHit, this.actionButtonStand]
  }

  /**
   * @returns {embed, buttons}
   */
  getMessage() {
    return {
      embed: this.getEmbed(),
      buttons: this.getButtons()
    }
  }

  // player action HIT
  hit() {
    this.playerHand.cards.push(Card.getRandom());

    // check for player blackjack or bust
    if(this.playerHand.getValue() == 21) this.win=3;
    else if(this.playerHand.getValue() > 21) this.win = -1;
  }

  // player action STAND
  stand() {
    // reveal the dealer's second card
    this.dealerHand.cards[1].isHidden = false;

    // get a card for dealer
    while(this.dealerHand.getValue()<17) { // dealer hit's in case of value less than 17
      this.dealerHand.cards.push(Card.getRandom());
    }

    // check for dealer
    if(this.dealerHand.getValue() > 21) { // dealer has bust
      this.win = 1; // player won
    }
    else { // dealer has not bust, so compare the player and the dealer
      if(this.playerHand.getValue() > this.dealerHand.getValue()) { // player won
        this.win = 1;
        return;
      }else if(this.playerHand.getValue() < this.dealerHand.getValue()) { // player lost
        this.win = -1;
        return;
      }else if(this.playerHand.getValue() == this.dealerHand.getValue()) { // tie
        this.win = 2;
        return;
      }
    }
  }
}

module.exports = {Card, Hand, GameState};