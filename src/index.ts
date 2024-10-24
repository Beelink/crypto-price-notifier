import * as Mexc from "mexc-api-sdk";
import tgBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { EBotCommand, EWhatToExpect, IPairSettings, IUsers } from "./types";
import {
  botCommands,
  defaultAlertPriceLower,
  defaultAlertPriceUpper,
  defaultCheckPeriod,
  defaultPair,
  defaultSpamPeriod,
} from "./constants";
import { getUser, getUserCurrentPair, setCurrentPair } from "./user";
import { formatPairStatus } from "./util";

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";

if (!botToken) {
  console.log(
    "please create an .env file and put your TELEGRAM_BOT_TOKEN there"
  );
}

const client = new Mexc.Spot();
const bot = new tgBot(botToken, { polling: true });

const users: IUsers = [];

bot.setMyCommands(botCommands);

const sendPairStatus = (chatId: number) => {
  const user = getUser(users, chatId);
  const currentPair = getUserCurrentPair(user);

  const pairList = user.pairs.map((p) => p.pair).join(" | ");

  bot.sendMessage(
    chatId,
    `current pair = ${currentPair.pair}

${formatPairStatus(currentPair)}

your pairs = ${pairList}
use /${EBotCommand.setpair} to switch between pairs`
  );
};

const listPairs = (chatId: number) => {
  const user = getUser(users, chatId);

  const message = user.pairs.map((p) => formatPairStatus(p)).join("\n\n");

  bot.sendMessage(chatId, message);
};

// set pair
const setPairStart = (chatId: number) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.pairToSet;

  bot.sendMessage(chatId, "enter pair");
};

const setPairEnd = (chatId: number, text?: string) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.command;

  const newValue = text || defaultPair;

  bot.sendMessage(chatId, `pair changed: ${user.currentPair} -> ${newValue}`);

  setCurrentPair(user, newValue);
};

// set alert price upper
const setAlertPriceUpperStart = (chatId: number) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.alertPriceUpper;

  bot.sendMessage(chatId, "enter alert price upper");
};

const setAlertPriceUpperEnd = (chatId: number, text?: string) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.command;

  const newValue = Number(text) || defaultAlertPriceUpper;

  const currentPair = getUserCurrentPair(user);

  bot.sendMessage(
    chatId,
    `alert price upper changed: ${currentPair.alertPriceUpper} -> ${newValue}`
  );

  currentPair.alertPriceUpper = newValue;
};

// set alert price lower
const setAlertPriceLowerStart = (chatId: number) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.alertPriceLower;

  bot.sendMessage(chatId, "enter alert price lower");
};

const setAlertPriceLowerEnd = (chatId: number, text?: string) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.command;

  const newValue = Number(text) || defaultAlertPriceLower;

  const currentPair = getUserCurrentPair(user);

  bot.sendMessage(
    chatId,
    `alert price lower changed: ${currentPair.alertPriceLower} -> ${newValue}`
  );

  currentPair.alertPriceLower = newValue;
};

// set check period
const setCheckPeriodStart = (chatId: number) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.checkPeriod;

  bot.sendMessage(chatId, "enter check period (in minutes), 0 = off");
};

const setCheckPeriodEnd = (chatId: number, text?: string) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.command;

  const newValue = Number(text) || defaultCheckPeriod;

  const currentPair = getUserCurrentPair(user);

  bot.sendMessage(
    chatId,
    `check period changed: ${currentPair.checkPeriod} -> ${newValue}`
  );

  currentPair.checkPeriod = newValue;

  if (currentPair.checkInterval) {
    clearInterval(currentPair.checkInterval);
    currentPair.checkInterval = null;
  }

  if (currentPair.checkPeriod) {
    currentPair.checkInterval = setInterval(
      () => checkLoop(chatId, currentPair),
      currentPair.checkPeriod * 60000
    ); // minutes
  }
};

// set spam period
const setSpamPeriodStart = (chatId: number) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.spamPeriod;

  bot.sendMessage(chatId, "enter spam period (in seconds), 0 = off");
};

const setSpamPeriodEnd = (chatId: number, text?: string) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.command;

  const newValue = Number(text) || defaultSpamPeriod;

  const currentPair = getUserCurrentPair(user);

  bot.sendMessage(
    chatId,
    `spam period changed: ${currentPair.spamPeriod} -> ${newValue}`
  );

  currentPair.spamPeriod = newValue;

  if (currentPair.spamInterval) {
    clearInterval(currentPair.spamInterval);
    currentPair.spamInterval = null;
  }

  if (currentPair.spamPeriod) {
    currentPair.spamInterval = setInterval(
      () => spamLoop(chatId, currentPair),
      currentPair.spamPeriod * 1000
    ); // seconds
  }
};

// stop spam
const stopSpam = (chatId: number) => {
  const user = getUser(users, chatId);
  const currentPair = getUserCurrentPair(user);

  currentPair.spamMode = false;
};

// set pair
const deletePairStart = (chatId: number) => {
  const user = getUser(users, chatId);

  if (user.pairs.length > 1) {
    user.whatToExpect = EWhatToExpect.pairToDelete;

    bot.sendMessage(chatId, "enter pair to delete");
  } else {
    bot.sendMessage(chatId, "you have only one pair");
  }
};

const deletePairEnd = (chatId: number, text?: string) => {
  const user = getUser(users, chatId);
  user.whatToExpect = EWhatToExpect.command;

  const deleteValue = text || "";

  if (user.pairs.find((p) => p.pair)) {
    user.pairs = user.pairs.filter((p) => p.pair !== deleteValue);
  }

  bot.sendMessage(chatId, `pair deleted: ${deleteValue}`);

  if (deleteValue === user.currentPair) {
    setCurrentPair(user, user.pairs[0].pair);

    bot.sendMessage(
      chatId,
      `pair changed: ${user.currentPair} -> ${user.pairs[0].pair}`
    );
  }
};

// message controller
bot.on("message", (msg) => {
  const user = getUser(users, msg.chat.id);

  if (user.whatToExpect === "command") {
    switch (msg.text) {
      case `/${EBotCommand.pairstatus}`:
        sendPairStatus(user.chatId);
        break;
      case `/${EBotCommand.listpairs}`:
        listPairs(user.chatId);
        break;
      case `/${EBotCommand.setpair}`:
        setPairStart(user.chatId);
        break;
      case `/${EBotCommand.setalertpriceupper}`:
        setAlertPriceUpperStart(user.chatId);
        break;
      case `/${EBotCommand.setalertpricelower}`:
        setAlertPriceLowerStart(user.chatId);
        break;
      case `/${EBotCommand.setcheckperiod}`:
        setCheckPeriodStart(user.chatId);
        break;
      case `/${EBotCommand.setspamperiod}`:
        setSpamPeriodStart(user.chatId);
        break;
      case `/${EBotCommand.stopspam}`:
        stopSpam(user.chatId);
        break;
      case `/${EBotCommand.deletepair}`:
        deletePairStart(user.chatId);
        break;
      default:
        bot.sendMessage(user.chatId, "im waiting for command");
        break;
    }
  } else {
    switch (user.whatToExpect) {
      case EWhatToExpect.pairToSet:
        setPairEnd(user.chatId, msg.text);
        break;
      case EWhatToExpect.pairToDelete:
        deletePairEnd(user.chatId, msg.text);
        break;
      case EWhatToExpect.alertPriceUpper:
        setAlertPriceUpperEnd(user.chatId, msg.text);
        break;
      case EWhatToExpect.alertPriceLower:
        setAlertPriceLowerEnd(user.chatId, msg.text);
        break;
      case EWhatToExpect.checkPeriod:
        setCheckPeriodEnd(user.chatId, msg.text);
        break;
      case EWhatToExpect.spamPeriod:
        setSpamPeriodEnd(user.chatId, msg.text);
        break;
    }
  }
});

const checkLoop = (_chatId: number, pair: IPairSettings) => {
  const res = client.avgPrice(pair.pair);

  pair.detectedPrice = res.price;

  if (pair.detectedPrice < pair.alertPriceLower) {
    pair.spamMode = true;
  }

  if (pair.detectedPrice > pair.alertPriceUpper) {
    pair.spamMode = true;
  }
};

const spamLoop = (chatId: number, pair: IPairSettings) => {
  if (pair.spamMode) {
    if (pair.detectedPrice < pair.alertPriceLower) {
      bot.sendMessage(
        chatId,
        `PRICE IS LOWER THEN ${pair.alertPriceLower} ! last detected price = ${pair.detectedPrice}`
      );
    }

    if (pair.detectedPrice > pair.alertPriceUpper) {
      bot.sendMessage(
        chatId,
        `PRICE IS BIGGER THEN ${pair.alertPriceUpper} ! last detected price = ${pair.detectedPrice}`
      );
    }
  }
};

console.log("started!");
