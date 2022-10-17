import { Telegraf } from 'telegraf';

import { commandArgs } from './helpers/telegraf-params.js';
import {
    start, help, password,
    randompass, login, register,
    logout, verifyExpirationDate,
    recover
} from './controllers/commands.js';

// * Assign token to the bot
const bot = new Telegraf(process.env.TOKEN_BOT);

const timeCheckTokenUser = 60;

// * Middleware to get the command args
bot.use(commandArgs());

// * Commands that can be used with the bot (no login required)
bot.start(start);
bot.help(help);
bot.command('randompass', (ctx) => randompass(ctx, bot));
bot.command('password', (ctx) => password(ctx, bot));
bot.command('register', (ctx) => register(ctx, bot));
bot.command('recover', (ctx) => recover(ctx, bot));

// * Commands that can be used with the bot (login required)
bot.command('login', (ctx) => login(ctx, bot));
bot.command('logout', (ctx) => logout(ctx, bot));

// * Method for init the bot
export const botStart = async () => {
    bot.launch();
    console.log(`${(await bot.telegram.getMe()).username} is started`);
};

// * Repeat every minute (60 seconds)
setInterval(() => verifyExpirationDate(bot), timeCheckTokenUser * 1000);
