import { translateText } from '../helpers/translate.js';
import 'cross-fetch/dist/node-polyfill.js';
import PocketBase from 'pocketbase';

import { getSessionUser, deleteSessionUser } from '../models/session.js';

const client = new PocketBase(process.env.POKETBASE_URL);

export const loginUser = async (params) => {
    try {
        const session = await getSessionUser(params.fromId);
        if (session !== undefined) return { inSession: true, error: false, data: { message: params.translate.texts.error.auth.existSession } };

        const login = await client.users.authViaEmail(params.email, params.password);

        if (!login.user.verified) {
            // * Request account verification
            await client.users.requestVerification(params.email);
            return { inSession: false, error: true, data: { message: params.translate.texts.error.auth.verify } };
        };

        const resp = {
            inSession: false,
            error: false,
            data: login
        };

        client.authStore.clear();

        return resp;
    } catch (error) {
        console.log('loginUser: ', error);
        return await errorAuth(error.data.message, params.translate);
    }
};

export const registerUser = async (params) => {
    try {
        const session = await getSessionUser(params.fromId);
        if (session !== undefined) return { inSession: true, error: false, data: { message: params.translate.texts.error.auth.existSession } };

        // * Create user in pocketbase
        const user = await client.users.create({
            email: params.email,
            password: params.password,
            passwordConfirm: params.password
        });

        // * Set user profile data
        await client.records.update('profiles', user.profile.id, {
            name: params.name
        });

        // * Request account verification
        await client.users.requestVerification(params.email);

        return { error: false, data: { message: `${params.name} ${params.translate.texts.normal.register}` } };
    } catch (error) {
        console.log('registerUser: ', error);
        return await errorAuth(error, params.translate);
    }
};

export const logoutUser = async (fromId, translate) => {
    try {
        const session = await getSessionUser(fromId);
        if (session === undefined) return { error: false, data: { message: translate.texts.error.auth.noAuthenticate } };

        await deleteSessionUser(fromId);
        return { error: false, data: { message: translate.texts.normal.logout } };
    } catch (error) {
        console.log('logoutUser: ', error);
        return await errorAuth(error, translate);
    }
};

export const recoverPassword = async (params) => {
    try {
        await client.users.requestPasswordReset(params.email);
        return { error: false, data: { message: params.translate.commands.commandRecover } };
    } catch (error) {
        console.log('recoverPassword: ', error);
        return await errorAuth(error, params.translate);
    }
};

export const currentsessionUser = async (fromId, languageCode) => {
    const translate = await translateText(languageCode);

    try {
        const session = await getSessionUser(fromId);

        if (session === undefined) return { error: true, data: { message: translate.texts.error.auth.noAuthenticate } };
        return { error: false, data: { message: JSON.stringify(session) } };
    } catch (error) {
        console.log('currentsessionUser: ', error);
        return await errorAuth(error, translate);
    }
};

const errorAuth = async (error, translate) => {
    switch (error) {
        case 'Failed to authenticate.':
            return {
                isValid: false,
                error: true,
                data: {
                    message: translate.texts.error.auth.authenticate
                }
            };
        default:
            return {
                isValid: false,
                error: true,
                data: {
                    message: translate.texts.error.generic.unknown
                }
            };
    }
};
