# crypto-price-notifier

Telegram bot for crypto price monitoring. Built on top of the `node-telegram-bot-api`

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

##### Managing pairs:

`/setpair` - add or change pair

`/deletepair` - delete pair

##### Managing alerts:

`/setalertpriceupper` - set alert price upper

`/setalertpricelower` - set alert price lower

`/setcheckperiod`- set how often to check price

`/setspamperiod` - set how ofter to send alert messages
Ï
`/stopspam` - stop alerting

### Possible improvements:

1. Add option to send message on price check
2. Validation for user input
3. Add ability to change price provider on per pair base (it is only MEXC for now)
4. Add error handlers for token price fetching
