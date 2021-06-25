
import { MessageEmbed, Message } from "discord.js";
import { MessageButton } from "discord-buttons";

export interface Suit {
  name:string,
  label:string
}

export interface Rank {
  label:string,
  value:number
}

export interface CustomMessageOptions {
  embed:MessageEmbed,
  buttons:MessageButton[]
}

export interface Game {
  message: Message,
  gameState: GameState
}

export enum Gif {
  win = "https://media.giphy.com/media/J5Ye3xSZk4CfAL12dX/giphy.gif",
  lose = "https://media.giphy.com/media/Y4z9olnoVl5QI/giphy.gif",
  tie = "https://media.giphy.com/media/xT3i0P4CYQcdmFZQkM/giphy.gif",
  blackjack = "https://media.giphy.com/media/cjPFESwD0lu7M9tCO2/giphy.gif",
  timeup = "https://media.giphy.com/media/gLjD6hjRaLcFslzpvR/giphy.gif"
}

export class Card {

  private _suit:Suit;
  private _rank:Rank;
  private _isHidden:boolean;
  private _isAce:boolean;

  constructor(suit:Suit, rank:Rank, isHidden:boolean) {
    this._suit = suit;
    this._rank = rank;
    this._isHidden = isHidden;
    this._isAce = (this._rank.label=="A" ? true : false);
  }

  public get suit():Suit {
    return this._suit;
  }

  public get rank():Rank {
    return this._rank;
  }

  public get isHidden():boolean {
    return this._isHidden;
  }
  public set isHidden(h:boolean) {
    this._isHidden = h;
  }

  public get isAce():boolean {
    return this._isAce;
  }

  public print():string {
    let x:string = "";
    if (!this._isHidden) {
      x += "**" + this._rank.label + "** ";
      x += this._suit.label;
    }
    else x += "🔒";
    return x;
  }

  public static readonly Rank:Rank[] = [
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

  public static readonly Suit:Suit[] = [
    {name: "Spade", label:"♤"},
    {name: "Heart", label:"♡"},
    {name: "Club", label:"♧"},
    {name: "Diamond", label:"♢"}
  ];

  public static getRandom(isHidden:boolean):Card {
    var rank = Card.Rank[Math.floor((Math.random() * 12) + 0)]; // value between 0 -> 12
    var suit = Card.Suit[Math.floor((Math.random() * 3) + 0)]; // value between 0 -> 3
    return new Card(suit, rank, isHidden);
  }
}

export class Hand {

  private _cards:Card[];

  constructor (_card0:Card, _card1:Card) {
    this._cards = [_card0, _card1];
  }

  public get cards():Card[] {
    return this._cards;
  }

  public getValue():number {
    let total:number = 0;
    let aceStack:Card[] = [];

    this._cards.map(card => {
      if (card.isAce) aceStack.push(card);
      total += card.rank.value;
    });

    if (total > 21) { // this is for dynamically changing the value of Ace Card
      for (let i in aceStack) {
        total -= 10;
        if (total <= 21) return total;
      }
    }
    return total;
  }

  public print():string {
    let doShowValue:boolean = true; // if false, the value of hand won't be displayed
    let x:string = this._cards[0].print();

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

export class GameState {
  private _dealerHand:Hand;
  private _playerHand:Hand;

  /**
   * -2 - Time-up
   * -1 - Lost
   * 0 - Default (Game is running)
   * 1 - Won
   * 2 - Tie
   * 3 - BlackJack
   */
  private _win:number = 0;

  private _timestamp = Date.now(); // game starting time

  private _actionButtonHit:MessageButton;
  private _actionButtonStand:MessageButton;

  constructor(dealerHand:Hand, playerHand:Hand) {
    this._dealerHand = dealerHand;
    this._playerHand = playerHand;

    this._actionButtonHit = new MessageButton()
      .setEmoji("🚀")
      .setStyle(1)
      .setID("hit");

    this._actionButtonStand = new MessageButton()
      .setEmoji("✨")
      .setStyle(2)
      .setID("stand");

    // check for player blackjack
    if(this._playerHand.getValue() == 21) this._win=3;
  }

  public isOver():boolean  {
    return this._win != 0;
  }

  public getEmbed():MessageEmbed {
    const message = new MessageEmbed()
      .setColor("#fcba03")
      .setTitle("BlackJack")
      .setDescription('You have started a BlackJack Game')
      .addField("Dealer Hand", this._dealerHand.print() , true)
      .addField("Player Hand", this._playerHand.print() , true)
      .setFooter("Response within 30 Seconds.");

    if (this._win !== 0) {
      this._actionButtonHit.setDisabled(true);
      this._actionButtonStand.setDisabled(true);
    }

    // Image for win, lose, tie, and blackjack
    if(this._win == 1) message.setImage(Gif.win);
    else if(this._win == -1) message.setImage(Gif.lose);
    else if(this._win == 2) message.setImage(Gif.tie);
    else if(this._win == 3) message.setImage(Gif.blackjack);
    else if(this._win == -2) message.setImage(Gif.timeup);

    return message;
  }

  public getButtons():MessageButton[] {
    return [this._actionButtonHit, this._actionButtonStand]
  }

  public getMessage():CustomMessageOptions {
    return {
      embed: this.getEmbed(),
      buttons: this.getButtons()
    }
  }

  // player action HIT
  public hit():void {
    if((Date.now() - this._timestamp) < 30000) { // check for time-up
      this._playerHand.cards.push(Card.getRandom(false));

      // check for player blackjack or bust
      if (this._playerHand.getValue() == 21) this._win = 3;
      else if (this._playerHand.getValue() > 21) this._win = -1;
    }
    else this._win = -2;
  }

  // player action STAND
  public stand():void {
    if((Date.now() - this._timestamp) < 30000) { // check for time-up
      // reveal the dealer's second card
      this._dealerHand.cards[1].isHidden=false;

      // get a card for dealer
      while (this._dealerHand.getValue() < 17) { // dealer hit's in case of value less than 17
        this._dealerHand.cards.push(Card.getRandom(false));
      }

      // check for dealer
      if(this._dealerHand.getValue() > 21) this._win = 1; // dealer has bust
      else { // dealer has not bust, so compare the player and the dealer
        if(this._playerHand.getValue() > this._dealerHand.getValue()) this._win = 1;
        else if(this._playerHand.getValue() < this._dealerHand.getValue()) this._win = -1;
        else if(this._playerHand.getValue() == this._dealerHand.getValue()) this._win = 2;
      }
    }
    else this._win = -2;
  }
}