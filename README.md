# MexcPrice | crypto-price-notifier

Built on top of the `mexc-api-sdk` and `node-telegram-bot-api`

### Start:

`ts-node` is needed

```bash
yarn
```

```bash
yarn start
```

### Possible improvements:

1. Add option to send message on price check
2. Store settings per user (per `chatId`)
3. Validation for user input
4. Add ability to watch multiple pairs (it is only one for now)
5. Store settings somewhere (in `json` or in `db`) to keep user settings when the bot is down
6. Add ability to change price provider (it is only MEXC for now)
