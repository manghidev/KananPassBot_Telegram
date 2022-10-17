export const commandArgs = () => (ctx, next) => {
    try {
        const text = ctx.update.message.text; //.toLowerCase();
        if (text.startsWith('/')) {
            const match = text.match(/^\/([^\s]+)\s?(.+)?/);
            let args = [];
            let command;
            if (match !== null) {
                if (match[1]) {
                    command = match[1];
                }
                if (match[2]) {
                    args = match[2].split(' ');
                }
            }
            ctx.state.command = {
                raw: text,
                command,
                args,
            };
        }
        return next();
    } catch (error) {
        // * Not is a text message
        return next();
    }
};
