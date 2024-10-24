import { defaultPair, defaultPairSettings } from "./constants";
import { IUsers, IUser, IPairSettings, EWhatToExpect } from "./types";

const createUser = (chatId: number): IUser => {
  return {
    chatId,
    pairs: [createUserPair(defaultPair)],
    currentPair: defaultPair,
    whatToExpect: EWhatToExpect.command,
  };
};

export const createUserPair = (pair: string): IPairSettings => {
  return {
    pair,
    ...defaultPairSettings,
  };
};

export const getUser = (users: IUsers, chatId: number): IUser => {
  const user = users.find((u) => u.chatId === chatId);

  if (user) return user;

  const newUser = createUser(chatId);
  users.push(newUser);

  return newUser;
};

export const getUserPair = (user: IUser, pairId: string) => {
  const pair = user.pairs.find((p) => p.pair === pairId);

  if (pair) return pair;

  const newPair = createUserPair(pairId);
  user.pairs.push(newPair);

  return newPair;
};

export const getUserCurrentPair = (user: IUser) => {
  return getUserPair(user, user.currentPair);
};

export const setCurrentPair = (user: IUser, newPairId: string) => {
  const pair = getUserPair(user, newPairId);

  user.currentPair = pair.pair;
};
