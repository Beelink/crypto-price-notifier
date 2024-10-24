import { EBotCommand } from "./types";

export const defaultPair = "ALEOUSDT";
export const defaultAlertPriceUpper = 99999999;
export const defaultAlertPriceLower = 0;
export const defaultCheckPeriod = 0;
export const defaultSpamPeriod = 0;

export const defaultPairSettings = {
  alertPriceLower: defaultAlertPriceLower,
  alertPriceUpper: defaultAlertPriceUpper,
  checkPeriod: defaultCheckPeriod,
  spamPeriod: defaultSpamPeriod,
  spamMode: false,
  checkInterval: null,
  spamInterval: null,
  detectedPrice: 0,
};

export const botCommands = [
  {
    command: EBotCommand.pairstatus,
    description: "get current pair info",
  },
  {
    command: EBotCommand.listpairs,
    description: "list all pairs info",
  },
  {
    command: EBotCommand.setpair,
    description: "set pair",
  },
  {
    command: EBotCommand.setalertpriceupper,
    description: "set alert price upper",
  },
  {
    command: EBotCommand.setalertpricelower,
    description: "set alert price lower",
  },
  {
    command: EBotCommand.setcheckperiod,
    description: "set how often to check price",
  },
  {
    command: EBotCommand.setspamperiod,
    description: "set how ofter to send alert messages",
  },
  {
    command: EBotCommand.stopspam,
    description: "stop alerting",
  },
  {
    command: EBotCommand.deletepair,
    description: "delete pair",
  },
];