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
import fs from "fs";

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const usersFile = "users.json";
const version = "2.0";

if (!botToken) {
  console.log(
    "please create an .env file and put your TELEGRAM_BOT_TOKEN there"
  );
}

const client = new Mexc.Spot();
const bot = new tgBot(botToken, { polling: true });

let users: IUsers = [];

fs.readFile(usersFile, (err, data) => {
  if (!err) {
    users = JSON.parse(data.toString());

    users.map((user) => {
      user.pairs.map((pair) => {
        if (pair.checkPeriod) {
          pair.checkInterval = setInterval(
            () => checkLoop(user.chatId, pair),
            pair.checkPeriod * 60000
          ); // minutes
        }

        if (pair.spamPeriod) {
          pair.spamInterval = setInterval(
            () => spamLoop(user.chatId, pair),
            pair.spamPeriod * 1000
          ); // seconds
        }
      });
    });
  }
});

bot.setMyCommands(botCommands);

const sendPairStatus = (chatId: number) => {
  const user = getUser(users, chatId);
  const currentPair = getUserCurrentPair(user);

  const message = user.pairs.map((p) => formatPairStatus(p)).join("\n\n");

  bot.sendMessage(
    chatId,
    `v${version}

your pairs:

${message}

current pair = ${currentPair.pair}
use /${EBotCommand.setpair} to switch between pairs or to add a new pair`
  );
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

  const newValue = (text || defaultPair)
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();

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

  const deleteValue = (text || "").replace(/[^a-zA-Z]/g, "").toUpperCase();

  const pairsLengthBeforeDeleting = user.pairs.length;

  if (user.pairs.find((p) => p.pair)) {
    user.pairs = user.pairs.filter((p) => p.pair !== deleteValue);
  }

  if (pairsLengthBeforeDeleting === user.pairs.length) {
    bot.sendMessage(chatId, `pair not found: ${deleteValue}`);
  } else {
    bot.sendMessage(chatId, `pair deleted: ${deleteValue}`);

    if (deleteValue === user.currentPair) {
      setCurrentPair(user, user.pairs[0].pair);

      bot.sendMessage(
        chatId,
        `pair changed: ${deleteValue} -> ${user.pairs[0].pair}`
      );
    }
  }
};

// message controller
bot.on("message", (msg) => {
  const user = getUser(users, msg.chat.id);

  if (user.whatToExpect === "command") {
    switch (msg.text) {
      case `/${EBotCommand.status}`:
        sendPairStatus(user.chatId);
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
        `PRICE IS LOWER THEN ${pair.alertPriceLower} ! last checked price = ${pair.detectedPrice}`
      );
    }

    if (pair.detectedPrice > pair.alertPriceUpper) {
      bot.sendMessage(
        chatId,
        `PRICE IS BIGGER THEN ${pair.alertPriceUpper} ! last fetched price = ${pair.detectedPrice}`
      );
    }
  }
};

console.log("started!");

setInterval(() => {
  fs.writeFile(
    usersFile,
    JSON.stringify(
      users.map((user) => ({
        ...user,
        pairs: user.pairs.map((pair) => ({
          ...pair,
          checkInterval: null,
          spamInterval: null,
        })),
      }))
    ),
    () => {}
  );
}, 1000);
