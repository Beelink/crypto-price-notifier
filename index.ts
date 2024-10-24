import * as Mexc from "mexc-api-sdk";
import tgBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";

if (!botToken) {
  console.log(
    "please create an .env file and put your TELEGRAM_BOT_TOKEN there"
  );
}

const client = new Mexc.Spot();
const bot = new tgBot(botToken, { polling: true });
let chatId = 0;
let whatToExpect:
  | "command"
  | "alertPriceUpper"
  | "alertPriceLower"
  | "pair"
  | "checkPeriod"
  | "spamPeriod" = "command";
let spamMode = false;
let checkInterval: NodeJS.Timeout | null = null;
let spamInterval: NodeJS.Timeout | null = null;
let detectedPrice = 0;

const defaultPair = "ALEOUSDT";
let pair = defaultPair;

const defaultAlertPriceUpper = 99999999;
let alertPriceUpper = defaultAlertPriceUpper;

const defaultAlertPriceLower = 0;
let alertPriceLower = defaultAlertPriceLower;

const defaultCheckPeriod = 0;
let checkPeriod = defaultCheckPeriod;

const defaultSpamPeriod = 0;
let spamPeriod = defaultSpamPeriod;

bot.setMyCommands([
  {
    command: "status",
    description: "get current price, alert price...",
  },
  {
    command: "setalertpriceupper",
    description: "set alert price upper",
  },
  {
    command: "setalertpricelower",
    description: "set alert price lower",
  },
  {
    command: "setpair",
    description: "set pair to watch",
  },
  {
    command: "setcheckperiod",
    description: "set how often to check price",
  },
  {
    command: "setspamperiod",
    description: "set how ofter to send alert messages",
  },
  {
    command: "stopspam",
    description: "stop alerting",
  },
  {
    command: "reset",
    description: "reset bot settings",
  },
]);

const sendStatus = () => {
  if (chatId) {
    const res = client.avgPrice(pair);

    bot.sendMessage(
      chatId,
      `
      chat id = ${chatId}
      pair = ${pair}
      current price = ${res.price}
      alert price upper = ${alertPriceUpper}
      alert price lower = ${alertPriceLower}
      check period = ${checkPeriod} minutes ${checkPeriod === 0 ? "(off)" : ""}
      spam period = ${spamPeriod} seconds ${spamPeriod === 0 ? "(off)" : ""}
      spam mode = ${spamMode ? "on" : "off"}
      `
    );
  }
};

// set pair
const setPairStart = () => {
  whatToExpect = "pair";

  bot.sendMessage(chatId, "enter pair");
};

const setPairEnd = (text?: string) => {
  whatToExpect = "command";

  const newValue = text || defaultPair;

  bot.sendMessage(chatId, `pair changed: ${pair} -> ${newValue}`);

  pair = newValue;
};

// set alert price upper
const setAlertPriceUpperStart = () => {
  whatToExpect = "alertPriceUpper";

  bot.sendMessage(chatId, "enter alert price upper");
};

const setAlertPriceUpperEnd = (text?: string) => {
  whatToExpect = "command";

  const newValue = Number(text) || defaultAlertPriceUpper;

  bot.sendMessage(
    chatId,
    `alert price upper changed: ${alertPriceUpper} -> ${newValue}`
  );

  alertPriceUpper = newValue;
};

// set alert price lower
const setAlertPriceLowerStart = () => {
  whatToExpect = "alertPriceLower";

  bot.sendMessage(chatId, "enter alert price lower");
};

const setAlertPriceLowerEnd = (text?: string) => {
  whatToExpect = "command";

  const newValue = Number(text) || defaultAlertPriceLower;

  bot.sendMessage(
    chatId,
    `alert price lower changed: ${alertPriceLower} -> ${newValue}`
  );

  alertPriceLower = newValue;
};

// set check period
const setCheckPeriodStart = () => {
  whatToExpect = "checkPeriod";

  bot.sendMessage(chatId, "enter check period (in minutes), 0 = off");
};

const setCheckPeriodEnd = (text?: string) => {
  whatToExpect = "command";

  const newValue = Number(text) || defaultCheckPeriod;

  bot.sendMessage(
    chatId,
    `check period changed: ${checkPeriod} -> ${newValue}`
  );

  checkPeriod = newValue;

  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  if (checkPeriod) {
    checkInterval = setInterval(checkLoop, checkPeriod * 60000); // minutes
  }
};

// set spam period
const setSpamPeriodStart = () => {
  whatToExpect = "spamPeriod";

  bot.sendMessage(chatId, "enter spam period (in seconds), 0 = off");
};

const setSpamPeriodEnd = (text?: string) => {
  whatToExpect = "command";

  const newValue = Number(text) || defaultSpamPeriod;

  bot.sendMessage(chatId, `spam period changed: ${spamPeriod} -> ${newValue}`);

  spamPeriod = newValue;

  if (spamInterval) {
    clearInterval(spamInterval);
    spamInterval = null;
  }

  if (spamPeriod) {
    spamInterval = setInterval(spamLoop, spamPeriod * 1000); // seconds
  }
};

// stop spam
const stopSpam = () => {
  spamMode = false;
};

// message controller
bot.on("message", (msg) => {
  chatId = msg.chat.id;

  console.log("msg", msg);

  if (whatToExpect === "command") {
    switch (msg.text) {
      case "/status":
        sendStatus();
        break;
      case "/setpair":
        setPairStart();
        break;
      case "/setalertpriceupper":
        setAlertPriceUpperStart();
        break;
      case "/setalertpricelower":
        setAlertPriceLowerStart();
        break;
      case "/setcheckperiod":
        setCheckPeriodStart();
        break;
      case "/setspamperiod":
        setSpamPeriodStart();
        break;
      case "/stopspam":
        stopSpam();
        break;
      case "/reset":
        reset();
      default:
        bot.sendMessage(chatId, "im waiting for command");
        break;
    }
  } else {
    switch (whatToExpect) {
      case "pair":
        setPairEnd(msg.text);
        break;
      case "alertPriceUpper":
        setAlertPriceUpperEnd(msg.text);
        break;
      case "alertPriceLower":
        setAlertPriceLowerEnd(msg.text);
        break;
      case "checkPeriod":
        setCheckPeriodEnd(msg.text);
        break;
      case "spamPeriod":
        setSpamPeriodEnd(msg.text);
        break;
    }
  }
});

const checkLoop = () => {
  if (chatId) {
    const res = client.avgPrice("ALEOUSDT");

    detectedPrice = res.price;

    if (detectedPrice < alertPriceLower) {
      spamMode = true;
    }

    if (detectedPrice > alertPriceUpper) {
      spamMode = true;
    }
  }
};

const spamLoop = () => {
  if (chatId && spamMode) {
    if (detectedPrice < alertPriceLower) {
      bot.sendMessage(
        chatId,
        `PRICE IS LOWER THEN ${alertPriceLower} ! last detected price = ${detectedPrice}`
      );
    }

    if (detectedPrice > alertPriceUpper) {
      bot.sendMessage(
        chatId,
        `PRICE IS BIGGER THEN ${alertPriceUpper} ! last detected price = ${detectedPrice}`
      );
    }
  }
};

const reset = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }

  if (spamInterval) {
    clearInterval(spamInterval);
  }

  whatToExpect = "command";
  spamMode = false;
  detectedPrice = 0;

  pair = defaultPair;
  alertPriceUpper = defaultAlertPriceUpper;
  alertPriceLower = defaultAlertPriceLower;
  checkPeriod = defaultCheckPeriod;
  spamPeriod = defaultSpamPeriod;

  bot.sendMessage(chatId, "bot reseted");

  chatId = 0;
};

console.log("started!");
