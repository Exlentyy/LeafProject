const mineflayer = require("mineflayer");
const TelegramBot = require("node-telegram-bot-api");
const mysql = require('mysql2');
const moment = require('moment');
const mineflayerViewer = require('prismarine-viewer').mineflayer

const telegramToken = '7939854602:AAHcj1CiNVGe4hMrQm6yKv_Om_GXxLEmFRs';
const tgBot = new TelegramBot(telegramToken, { polling: true });

let currentChatId = null;
let delayMessageInProgress = false;

const db = mysql.createConnection({
    host: '65.108.99.34',
    port: 3306,
    user: 'gs61785',
    password: 'JhEvRBVI9J',
    database: 'gs61785'
});

db.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
        return;
    }
});

const botInfoList = [
    { username: 'LeafProject_01', an: 102 },
    { username: 'LeafProject_02', an: 103 },
    { username: 'LeafProject_03', an: 104 },
    { username: 'LeafProject_04', an: 105 },
    { username: 'LeafProject_05', an: 106 },
    { username: 'LeafProject_06', an: 107 },
    { username: 'LeafProject_07', an: 108 },
    { username: 'LeafProject_08', an: 203 },
    { username: 'LeafProject_09', an: 204 },
    { username: 'LeafProject_10', an: 205 },
    { username: 'LeafProject_11', an: 206 },
    { username: 'LeafProject_12', an: 207 },
    { username: 'LeafProject_13', an: 208 },
    { username: 'LeafProject_14', an: 209 }
];

const createBots = () => {
    return botInfoList.map(botInfo => {
        const bot = mineflayer.createBot({
            host: 'mc.funtime.su',
            username: botInfo.username,
            password: 'LeafProject_0111',
            version: '1.16.5',
            logErrors: false,
            hideErrors: true,
        });

        bot.once('spawn', () => {
            mineflayerViewer(bot, {
                port:3007,
                firstPerson: true,
                viewDistance: "25"
            })
            bot.chat(`/reg LeafProject_0111`);
            bot.chat(`/l LeafProject_0111`);
            bot.chat(`/an${botInfo.an}`);
        });

        return bot;
    });
};

const bots = createBots();

function sendMessageToMinecraft(text) {
    bots.forEach(bot => bot.chat(text));
}

tgBot.on('polling_error', (error) => {
    console.error('Polling error:', error); // Логируем ошибку
});

tgBot.on('message', (msg) => {
    const text = msg.text;
    currentChatId = msg.chat.id;
    chatId = msg.chat.id;
    if (text.startsWith('/chat ')) {
        const messageToSend = text.slice(6);  // Получаем текст после /chat

        // Отправляем текст в Minecraft
        sendMessageToMinecraft(messageToSend);

        // Подтверждаем отправку
        tgBot.sendMessage(chatId, `Сообщение отправлено в чат Minecraft: ${messageToSend}`);
    }
    if (text === '/start') {
        const userId = msg.from.id;
        db.query('SELECT * FROM users WHERE userID = ?', [userId], (err, results) => {
            if (err) {
                console.error('Ошибка при запросе в БД:', err);
                tgBot.sendMessage(currentChatId, 'Произошла ошибка, попробуйте позже.');
                return;
            }
            if (results.length > 0) {
                tgBot.sendMessage(currentChatId, '🌟 Главное меню 🌟\n\n❤️ Спасибо что вы выбрали нас! ❤️');
            } else {
                tgBot.sendMessage(currentChatId, '🌟 Введите свой логин:');
            }
        });
    }
    if (text && text !== '/start') {
        const userId = msg.from.id;

        db.query('SELECT * FROM users WHERE userID = ?', [userId], (err, results) => {
            if (err) {
                console.error('Ошибка при запросе в БД:', err);
                tgBot.sendMessage(currentChatId, 'Произошла ошибка, попробуйте позже.');
                return;
            }

            if (results.length === 0) {
                const login = text;
                db.query('INSERT INTO users (userID, login) VALUES (?, ?)', [userId, login], (err) => {
                    if (err) {
                        console.error('Ошибка при добавлении в БД:', err);
                        tgBot.sendMessage(currentChatId, 'Произошла ошибка при регистрации.');
                        return;
                    }
                    tgBot.sendMessage(currentChatId, '🌟 Главное меню 🌟\n\n❤️️ Спасибо что вы выбрали нас! ❤️');
                });
            }
        });
    }

    if (text == '/help') {
        tgBot.sendMessage(currentChatId, '[🔑] Помощь: \n\nКупить подписку: https://funpay.com/users/9354001\nБлижайшие ивенты - /coming\nПрофиль - /profile\nГлавное меню - /start\n\nТех Поддержка: https://discord.gg/2mze4Mhc');
    }

    if (text === '/coming') {
        checkUserSubscription(msg.from.id, (isSubscribed) => {
            if (isSubscribed) {
                bots.forEach(bot => bot.chat('/event delay'));
            } else {
                tgBot.sendMessage(currentChatId, '[🔑] Извините, у вас нет подписки. Купить можно здесь:\n\nhttps://funpay.com/users/9354001');
            }
        });
    }
    if (text.startsWith('/givesub')) {
        const parts = text.split(' ');

        if (parts.length < 3) {
            tgBot.sendMessage(currentChatId, 'Неверный формат команды. Используйте: /givesub [Логин | UID] [подписка]');
            return;
        }

        const userIdentifier = parts[1];
        const subscriptionPeriod = parts[2];


        function parseSubscriptionPeriod(period) {
            const regex = /^(\d+)([hmsdwy])$/;
            const match = period.match(regex);

            if (!match) {
                return null;
            }

            const value = parseInt(match[1], 10);
            const unit = match[2];

            let milliseconds = 0;

            switch (unit) {
                case 'h':
                    milliseconds = value * 60 * 60 * 1000;
                    break;
                case 'm':
                    milliseconds = value * 60 * 1000;
                    break;
                case 's':
                    milliseconds = value * 1000;
                    break;
                case 'd':
                    milliseconds = value * 24 * 60 * 60 * 1000;
                    break;
                case 'w':
                    milliseconds = value * 7 * 24 * 60 * 60 * 1000;
                    break;
                case 'mo':
                    milliseconds = value * 30 * 24 * 60 * 60 * 1000;
                    break;
                case 'y':
                    milliseconds = value * 365 * 24 * 60 * 60 * 1000;
                    break;
                default:
                    return null;
            }

            return milliseconds;
        }

        const subscriptionTimeInMs = parseSubscriptionPeriod(subscriptionPeriod);
        if (subscriptionTimeInMs === null) {
            tgBot.sendMessage(currentChatId, 'Неверный формат подписки. Пример: 1h, 1m, 1s, 1mo, 1y, 1w');
            return;
        }

        const subscriptionDate = new Date();
        subscriptionDate.setTime(subscriptionDate.getTime() + subscriptionTimeInMs);

        const mskOptions = { timeZone: 'Europe/Moscow', hour12: false };
        const mskDateString = subscriptionDate.toLocaleString('ru-RU', mskOptions);

        checkUserRole(msg.from.id, ['Владелец'], (isAuthorized) => {
            if (!isAuthorized) {
                tgBot.sendMessage(currentChatId, '[🔑] У вас нет прав для выполнения этой команды.');
                return;
            }

            const query = isNaN(userIdentifier) ? 'SELECT * FROM users WHERE login = ?' : 'SELECT * FROM users WHERE id = ?';
            const queryParam = isNaN(userIdentifier) ? userIdentifier : parseInt(userIdentifier);

            db.query(query, [queryParam], (err, results) => {
                if (err) {
                    console.error('Ошибка при запросе пользователя:', err);
                    tgBot.sendMessage(currentChatId, 'Ошибка при выполнении команды.');
                    return;
                }

                if (results.length > 0) {
                    const user = results[0];

                    db.query('UPDATE users SET subscribed = ? WHERE id = ?', [subscriptionDate, user.id], (updateErr) => {
                        if (updateErr) {
                            console.error('Ошибка при обновлении подписки:', updateErr);
                            tgBot.sendMessage(currentChatId, 'Ошибка при обновлении подписки пользователя.');
                            return;
                        }

                        tgBot.sendMessage(currentChatId, `Подписка пользователя ${user.login} (ID: ${user.id}) успешно обновлена до: ${mskDateString}`);
                    });
                } else {
                    tgBot.sendMessage(currentChatId, 'Пользователь не найден.');
                }
            });
        });
    }
    if (text === '/profile') {
        db.query('SELECT * FROM users WHERE userID = ?', [msg.from.id], (err, results) => {
            if (err) {
                console.error('Ошибка при запросе профиля:', err);
                tgBot.sendMessage(currentChatId, 'Ошибка при получении профиля.');
                return;
            }

            if (results.length > 0) {
                const user = results[0];
                const subscriptionDate = user.subscribed ? moment(user.subscribed) : null;
                const currentDate = moment();

                let subscriptionStatus = 'Нет';
                let formattedSubscriptionDate = '';

                if (subscriptionDate) {
                    if (subscriptionDate.isAfter(currentDate)) {
                        subscriptionStatus = 'Да';
                        formattedSubscriptionDate = subscriptionDate.format('DD.MM.YYYY');
                    } else {
                        subscriptionStatus = 'Нет';
                    }
                }

                const profileMessage = `👤 Профиль: ${user.login}\n\n💗 Ваш UID: ${user.id}\n🆔 Ваш ID: ${user.userID}\n🔑 Роль: ${user.role}\n📅 Подписка: ${subscriptionStatus}${subscriptionStatus === 'Да' ? ` || ${formattedSubscriptionDate}` : ''}`;
                tgBot.sendMessage(currentChatId, profileMessage);
            } else {
                tgBot.sendMessage(currentChatId, 'Ваш профиль не найден. Пожалуйста, зарегистрируйтесь.');
            }
        });
    }
    if (text.startsWith('/giverole')) {
        const parts = text.split(' ');
        if (parts.length < 3) {
            tgBot.sendMessage(currentChatId, 'Неверный формат команды. Используйте: /giverole [Логин | UID] [роль]');
            return;
        }

        const userIdentifier = parts[1];
        const role = parts[2];
        checkUserRole(msg.from.id, ['Владелец'], (isAuthorized) => {
            if (!isAuthorized) {
                tgBot.sendMessage(currentChatId, '[🔑] У вас нет прав для выполнения этой команды.');
                return;
            }

            const query = isNaN(userIdentifier) ? 'SELECT * FROM users WHERE login = ?' : 'SELECT * FROM users WHERE id = ?';
            const queryParam = isNaN(userIdentifier) ? userIdentifier : parseInt(userIdentifier);

            db.query(query, [queryParam], (err, results) => {
                if (err) {
                    console.error('Ошибка при запросе пользователя:', err);
                    tgBot.sendMessage(currentChatId, 'Ошибка при выполнении команды.');
                    return;
                }

                if (results.length > 0) {
                    const user = results[0];
                    db.query('UPDATE users SET role = ? WHERE id = ?', [role, user.id], (updateErr, updateResults) => {
                        if (updateErr) {
                            console.error('Ошибка при обновлении роли:', updateErr);
                            tgBot.sendMessage(currentChatId, 'Ошибка при обновлении роли пользователя.');
                            return;
                        }
                        tgBot.sendMessage(currentChatId, `Роль пользователя ${user.login} (ID: ${user.id}) успешно обновлена на: ${role}`);
                    });
                } else {
                    tgBot.sendMessage(currentChatId, 'Пользователь не найден.');
                }
            });
        });
    }
});

const handleBotMessage = (bot, message) => {
    const messageText = message.toString();
    let messageToSend = "";
    const delayMatch = messageText.match(/\[⌛\] Команда будет доступна через (\d+) сек/);
    if (delayMatch && currentChatId) {
        if (!delayMessageInProgress) {
            messageToSend += '[⌛] Пожалуйста подождите, боты возможно только что зашли.\n';
            delayMessageInProgress = true;
            setTimeout(() => {
                delayMessageInProgress = false;
            }, 2000);
        }
    }

    const eventMatch = messageText.match(/\[1\] До следующего ивента: (\d+) сек/);
    if (eventMatch && currentChatId) {
        const secondsLeft = eventMatch[1];
        const botIndex = botInfoList.findIndex(info => info.username === bot.username);
        if (botIndex >= 0) {
            const botInfo = botInfoList[botIndex];
            const eventTimeMessage = `[👾] Анархия[${botInfo.an}]: ${secondsLeft} сек.`;
            messageToSend += eventTimeMessage;
        }
    }

    if (messageToSend.trim() && currentChatId) {
        tgBot.sendMessage(currentChatId, messageToSend.trim());
    }
};

const performPeriodicActions = (bot) => {
    setInterval(() => {
        bot.setControlState('jump', true);
        setTimeout(() => {
            bot.setControlState('jump', false);
        }, 500);
        bot.chat('/ebal');
    }, 2 * 60 * 500);
};


bots.forEach(bot => {
    bot.on('message', (message) => handleBotMessage(bot, message));
    performPeriodicActions(bot);
});

// Мусор

function checkUserSubscription(userId, callback) {
    const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');

    db.query('SELECT subscribed FROM users WHERE userID = ?', [userId], (err, results) => {
        if (err) {
            console.error('Ошибка при запросе подписки:', err);
            callback(false);
            return;
        }

        if (results.length > 0) {
            const user = results[0];
            if (user.subscribed && moment(user.subscribed).isAfter(currentDate)) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}

function checkUserRole(userId, allowedRoles, callback) {
    db.query('SELECT role FROM users WHERE userID = ?', [userId], (err, results) => {
        if (err) {
            console.error('Ошибка при проверке роли пользователя:', err);
            callback(false);
            return;
        }

        if (results.length > 0) {
            const userRole = results[0].role;
            callback(allowedRoles.includes(userRole));
        } else {
            callback(false);
        }
    });
}
