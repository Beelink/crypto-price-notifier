# crypto-price-notifier

Telegram bot for crypto price monitoring. Built on top of the `node-telegram-bot-api`

### How it works?

Use `/setpair` to set a token pair to watch (the `ALEO_USDT` pair is set by default). Change the upper or lower alert price using `/setalertpriceupper` or `/setalertpricelower` or both. Set the check and spam periods using `/setcheckperiod` and `/setspamperiod`. 5 minutes is optimal for checking, and 10 seconds is optimal for spamming. If the token price is lower than `alert price lower` or the token price is bigger than `alert price upper` you are going to be spammed every 10 seconds with a new message from the bot. You can prevent the bot from spamming using the `/stopspam` command until the new price is fetched.

### Price providers:

- MEXC using `mexc-api-sdk`

### Start:

`ts-node` is needed

```bash
yarn
```

```bash
yarn start
```

### Commands:

`/status` - get current pair info

##### Manage pairs:

`/setpair` - add or change pair

`/deletepair` - delete pair

##### Manage alerts:

`/setalertpriceupper` - set alert price upper

`/setalertpricelower` - set alert price lower

`/setcheckperiod`- set how often to check price

`/setspamperiod` - set how ofter to send alert messages

`/stopspam` - stop alerting

### Possible improvements:

1. Add option to send message on price check
2. Validation for user input
3. Add ability to change price provider on per pair base (it is only MEXC for now)
4. Add error handlers for token price fetching
