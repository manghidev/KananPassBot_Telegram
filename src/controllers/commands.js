import { translateText } from '../helpers/translate.js';
import { generatePassword } from 'random-generated-password';
import { loginUser, logoutUser, registerUser, recoverPassword } from './auth.js';
import { createSessionUser, verifyExpirationTokenDate } from '../models/session.js';

const timeDelayTyping = 1.5;
const timeDelayDeleteMessage = 5;

export const start = async (ctx) => {
    const translate = await translateText(ctx.message.from.language_code);

    ctx.reply(translate.commands.commandStart);
};

export const help = async (ctx) => {
    const translate = await translateText(ctx.message.from.language_code);

    ctx.reply(translate.commands.commandhelp);

    await deleteMessageChat(ctx, ctx.message.from.id, ctx.message.message_id);
};

export const randompass = async (ctx, bot) => {
    const translate = await translateText(ctx.message.from.language_code);

    bot.telegram.sendChatAction(ctx.message.from.id, 'typing');
    await delayTime(async () => {
        const botMsg = await ctx.reply(generatePassword({ size: (Math.floor(Math.random() * 30) + 8), type: 'all' }));

        // * Delete message which contain the password
        delayTime(async () => {
            await deleteMessageChat(ctx, ctx.message.from.id, botMsg.message_id);
            ctx.reply(translate.texts.normal.deleteMessage);
        }, timeDelayDeleteMessage);
    }, timeDelayTyping);
    await deleteMessageChat(ctx, ctx.message.from.id, ctx.message.message_id);
};

export const password = async (ctx, bot) => {
    const translate = await translateText(ctx.message.from.language_code);

    bot.telegram.sendChatAction(ctx.message.from.id, 'typing');
    const params = ctx.state.command.args;

    if (params.length === 0 || params.length === 1 || params.length > 2) return ctx.reply(translate.commands.commandPassword);

    await delayTime(async () => {
        const botMsg = await ctx.reply(generatePassword({ size: parseInt(params[0]), type: params[1] }));

        delayTime(async () => {
            await deleteMessageChat(ctx, ctx.message.from.id, botMsg.message_id);
            ctx.reply(translate.texts.normal.deleteMessage);
        }, timeDelayDeleteMessage);
    }, timeDelayTyping);

    await deleteMessageChat(ctx, ctx.message.from.id, ctx.message.message_id);
};

export const login = async (ctx, bot) => {
    const translate = await translateText(ctx.message.from.language_code);

    bot.telegram.sendChatAction(ctx.message.from.id, 'typing');
    const args = ctx.state.command.args;

    // * Check if the user has sent the email and the password
    if (args.length < 2 || args.length > 2) return ctx.reply(translate.commands.commandLogin);

    const resp = await loginUser({
        email: args[0],
        password: args[1],
        fromId: ctx.message.from.id,
        translate
    });

    // * Check if exist an error
    if (resp.error) {
        await deleteMessageChat(ctx, ctx.message.from.id, ctx.message.message_id);
        return ctx.reply(resp.data.message);
    }

    // * Is authenticated
    if (!resp.inSession) {
        // * Send image of the user or the welcome
        if (resp.data.user.profile.avatar !== '') {
            await sendImageToChat(ctx, bot, `${process.env.POKETBASE_URL}/api/files/${resp.data.user.profile['@collectionId']}/${resp.data.user.profile.id}/${resp.data.user.profile.avatar}`);
        }

        // * Create a session for the user
        await delayTime(async () => await createSessionUser({
            fromId: ctx.message.from.id,
            expirationDate: new Date(Date.now() + (1000 * 60 * 60 * 24 * 10)),
            dataUser: {
                language_code: ctx.message.from.language_code,
                ...resp.data
            }
        }), timeDelayTyping);

        ctx.reply(`🎉 ${translate.texts.normal.welcome} ${resp.data.user.profile.name} 🎉`);
    } else {
        await delayTime(() => ctx.reply(resp.data.message), timeDelayTyping);
    }

    await deleteMessageChat(ctx, ctx.message.from.id, ctx.message.message_id);
};

export const register = async (ctx, bot) => {
    const translate = await translateText(ctx.message.from.language_code);

    bot.telegram.sendChatAction(ctx.message.from.id, 'typing');
    const args = ctx.state.command.args;

    // * Check if the user has sent the email and the password
    if (args.length < 3 || args.length > 3) return ctx.reply(translate.commands.commandRegister);

    const resp = await registerUser({
        email: args[0],
        password: args[1],
        name: args[2],
        fromId: ctx.message.from.id,
        translate
    });

    await deleteMessageChat(ctx, ctx.message.from.id, ctx.message.message_id);
    ctx.reply(resp.data.message);
};

export const recover = async (ctx, bot) => {
    const translate = await translateText(ctx.message.from.language_code);

    bot.telegram.sendChatAction(ctx.message.from.id, 'typing');
    const args = ctx.state.command.args;

    const resp = await recoverPassword({
        email: args[0],
        translate
    });

    ctx.reply(resp.data.message);
};

export const logout = async (ctx, bot) => {
    const translate = await translateText(ctx.message.from.language_code);

    bot.telegram.sendChatAction(ctx.message.from.id, 'typing');
    const resp = await logoutUser(ctx.message.from.id, translate);

    if (resp.error) return ctx.reply(resp.data.message);

    await delayTime(() => ctx.reply(resp.data.message), timeDelayTyping);
    await deleteMessageChat(ctx, ctx.message.from.id, ctx.message.message_id);
};

// * Method for send a image to chat
const sendImageToChat = async (ctx, bot, image) => {
    await bot.telegram.sendPhoto(ctx.message.from.id, {
        url: image
    });
};

// * Delete the message in the chat
const deleteMessageChat = async (ctx, fromId, messageId) => {
    ctx.telegram.deleteMessage(fromId, messageId);
};

// * Method for create a delay of time
const delayTime = async (myFunction, time) => setTimeout(myFunction, time * 1000);

// * Method for check a token user
export const verifyExpirationDate = verifyExpirationTokenDate;
