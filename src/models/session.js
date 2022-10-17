import { translateText } from '../helpers/translate.js';
import PocketBase from 'pocketbase';

const client = new PocketBase(process.env.POKETBASE_URL);

export const createSessionUser = async (params) => {
    try {
        return await client.records.create(process.env.TABLE_SESSIONS, {
            fromId: params.fromId,
            expirationDate: params.expirationDate,
            dataUser: params.dataUser,
            dateSession: new Date()
        });
    } catch (error) {
        console.log('createSessionUser: ', error);
        return errorAuth(error);
    }
};

export const getSessionUser = async (fromId) => {
    try {
        const sessionUser = await client.records.getList(process.env.TABLE_SESSIONS, 1, 1, {
            filter: 'fromId = ' + fromId
        });

        return sessionUser.items[0];
    } catch (error) {
        console.log('getSessionUser: ', error);
        return error;
    }
};

export const deleteSessionUser = async (fromId) => {
    try {
        const sessionUser = await client.records.getList(process.env.TABLE_SESSIONS, 1, 1, {
            filter: 'fromId = ' + fromId
        });

        if (sessionUser.items.length === 0) return;
        await client.records.delete(process.env.TABLE_SESSIONS, sessionUser.items[0].id);
    } catch (error) {
        console.log('deleteSessionUser: ', error);
    }
};

export const verifyExpirationTokenDate = async (bot) => {
    try {
        const records = await client.records.getFullList(process.env.TABLE_SESSIONS, 200 /* batch size */, {
            sort: 'expirationDate',
        });

        for (let i = 0; i < records.length; i++) {
            const record = records[i];

            if (new Date() >= new Date(record.expirationDate)) {
                const translate = await translateText(record.dataUser.language_code);

                bot.telegram.sendMessage(record.fromId, `${translate.texts.normal.hello} ${record.dataUser.user.profile.name} 🤓 ${translate.texts.normal.am} ${(await bot.telegram.getMe()).username} 🤙🏽 \n ${translate.texts.normal.closedSession}`);
                await client.records.delete(process.env.TABLE_SESSIONS, record.id);
            }
        }
    } catch (error) {
        console.log('verifyExpirationTokenDate: ', error);
    }
};
