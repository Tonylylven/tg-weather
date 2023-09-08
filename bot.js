const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('5963484994:AAHMXY8d_pR64pVNT-FeGbCw2DZe36xNvcM', { polling: true });
const axios = require('axios');

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const text = 'Привет, я бот Tonylylven! Подпишись на мой канал twitch.tv/tonylylven.';
  const keyboard = [
    [{ text: 'Погода', callback_data: 'weather' }]
  ];

  bot.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
});

bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === 'weather') {
    bot.sendMessage(chatId, 'Введите город:');
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (msg.text) {
    const city = text;
    const apiKey = '42422285deaa575fb996d6370b694119';
    try {
      const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
      const temperature = response.data.main.temp;
      const description = response.data.weather[0].description;

      bot.sendMessage(chatId, `Погода в городе ${city}: \nТемпература: ${temperature}°C \nОписание: ${description}`);
    } catch (error) {
      bot.sendMessage(chatId, 'Не удалось получить данные о погоде. Проверьте правильность ввода города.');
    }
  }
});

bot.startPolling();