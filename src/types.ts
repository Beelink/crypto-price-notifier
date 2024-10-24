export enum EWhatToExpect {
  command = "command",
  alertPriceUpper = "alertPriceUpper",
  alertPriceLower = "alertPriceLower",
  pairToSet = "pairToSet",
  pairToDelete = "pairToDelete",
  checkPeriod = "checkPeriod",
  spamPeriod = "spamPeriod",
}

export enum EBotCommand {
  status = "status",
  setalertpriceupper = "setalertpriceupper",
  setalertpricelower = "setalertpricelower",
  setpair = "setpair",
  setcheckperiod = "setcheckperiod",
  setspamperiod = "setspamperiod",
  stopspam = "stopspam",
  deletepair = "deletepair",
}

export interface IPairSettings {
  pair: string;
  spamMode: boolean;
  checkInterval: NodeJS.Timeout | null;
  spamInterval: NodeJS.Timeout | null;
  detectedPrice: number;
  alertPriceUpper: number;
  alertPriceLower: number;
  checkPeriod: number;
  spamPeriod: number;
}

export interface IUser {
  chatId: number;
  whatToExpect: EWhatToExpect;
  pairs: IPairSettings[];
  currentPair: string;
}

export type IUsers = IUser[];
