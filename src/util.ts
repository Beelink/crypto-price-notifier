import { IPairSettings } from "./types";

export const formatPairStatus = (pair: IPairSettings) => {
  return `pair = ${pair.pair}
last checked price = ${pair.detectedPrice || "?"}
alert price upper = ${pair.alertPriceUpper}
alert price lower = ${pair.alertPriceLower}
check period = ${pair.checkPeriod} minutes ${
    pair.checkPeriod === 0 ? "(off)" : ""
  }
spam period = ${pair.spamPeriod} seconds ${pair.spamPeriod === 0 ? "(off)" : ""}
spam mode = ${pair.spamMode ? "on" : "off"}`;
};
