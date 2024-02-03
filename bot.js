const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('6354901402:AAGyllShFHezLzlNfsmVVf-ccz8pQzwTlgA');
const axios = require('axios');
const schedule = require('node-schedule');

const weatherByChatId = {}; // объект для хранения погоды по идентификатору чата
const remindersByChatId = {}; // объект для хранения напоминаний по идентификатору чата

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const text = 'Привет, я бот Tonylylven! Подпишись на мой канал twitch.tv/tonylylven.';
  const keyboard = [
    [{ text: 'Погода', callback_data: 'weather' }],
    [{ text: 'Сохранить город', callback_data: 'saveCity' }],
    [{ text: 'Напоминание', callback_data: 'reminder' }],
    [{ text: 'Отменить все напоминания', callback_data: 'cancelReminders' }]
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

  if (data === 'saveCity') {
    weatherByChatId[chatId] = { isWaitingForWeather: true }; // сохраняем состояние ожидания ввода города
    bot.sendMessage(chatId, 'Введите город для сохранения:');
  }

  if (data === 'weather' && weatherByChatId[chatId]?.city) { // проверяем, сохранен ли город для данного чата
    getWeather(chatId, weatherByChatId[chatId].city);
  }

  if (data === 'reminder') {
    bot.sendMessage(chatId, 'Введите дату и время напоминания в формате ГГГГ-ММ-ДД ЧЧ:ММ:');
    remindersByChatId[chatId] = { isWaitingForReminder: true }; // сохраняем состояние ожидания ввода даты и времени напоминания
  }

  if (data === 'cancelReminders') {
    cancelAllReminders(chatId);
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (weatherByChatId[chatId]?.isWaitingForWeather) { // проверяем, ожидается ли ввод города для данного чата
    weatherByChatId[chatId].isWaitingForWeather = false;
    weatherByChatId[chatId].city = text; // сохраняем введенный город для данного чата
    bot.sendMessage(chatId, 'Город сохранен');
  }

  if (remindersByChatId[chatId]?.isWaitingForReminder) { // проверяем, ожидается ли ввод даты и времени напоминания для данного чата
    const reminderDate = new Date(text);
    if (isNaN(reminderDate)) {
      bot.sendMessage(chatId, 'Некорректный формат даты и времени. Попробуйте снова:');
    } else {
      remindersByChatId[chatId].isWaitingForReminder = false;
      createReminder(chatId, 'Время напоминания!', reminderDate);
      bot.sendMessage(chatId, 'Напоминание создано');
    }
  }
});

async function getWeather(chatId, city) {
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

function createReminder(chatId, message, date) {
  const job = schedule.scheduleJob(date, () => {
    bot.sendMessage(chatId, message);
  });

  // Важно сохранить ссылку на задачу, чтобы в дальнейшем можно было отменить напоминание
  if (!remindersByChatId[chatId]) {
    remindersByChatId[chatId] = { jobs: [] };
  }
  remindersByChatId[chatId].jobs.push(job);

  return job;
}

function cancelAllReminders(chatId) {
  if (remindersByChatId[chatId]) {
    const jobs = remindersByChatId[chatId].jobs;
    jobs.forEach((job) => {
      job.cancel();
    });
    delete remindersByChatId[chatId];
    bot.sendMessage(chatId, 'Все напоминания отменены');
  } else {
    bot.sendMessage(chatId, 'У вас нет активных напоминаний');
  }
}

bot.startPolling();