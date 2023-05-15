import { Telegraf, session } from 'telegraf'
import config from 'config'
import { message } from 'telegraf/filters'
import { ogg } from './ogg.js'
import { openai} from './openai.js'
import { code } from 'telegraf/format'

const INITIAL_SESSION = {
    messages: [],
    isFirstSession: true,
};

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

bot.use(session())

bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('New session started')
})

bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('New session started')
})

bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {

        await ctx.reply(code('Transcription in progress...'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        console.log(link)
        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.toMp3(oggPath, userId)

        const text = await openai.transcription(mp3Path)
        await ctx.reply(code(`Your request: ${text}`))

        ctx.session.messages.push({ role: openai.roles.USER, content: text })

        const response = await openai.chat(ctx.session.messages)

        ctx.session.messages.push({ 
            role: openai.roles.ASSISTANT, 
            content: response.content 
        })

        await ctx.reply(response.content)
    } catch (e) {
        console.log("Error: while voice message ", e.message)
    }
})

console.log(config.get('TEST_ENV'))

bot.on(message('text'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
      await ctx.reply(`Processing your request...`);
  
      if (ctx.session.isFirstSession) {
        const newSessionText = `
        Ты очень талантливый продажник чего угодно. Ты можешь продать что угодно, начиная от люксовых брендов. Ты учтив с клиентами. Ты обладатель многократных призовых мест по продажам.
        Мне нужны твои лучшие ответы, чтобы помочь мне продавать мой товар кому угодно. Мне нужно, чтобы ты помог мне делать очень классные предложения и сделки, от которых невозможно отказаться.
        Вот пример:
        “Интересно. Не успеваете вовремя выложить пост или историю? Или не знаете что выкладывать в своем аккаунте? Эти проблемы можно решить за пару минут с помощью SmmBox. Сервис составит контент-план и автоматически будет публиковать материал любого формата. А еще он найдет популярный контент под указанную тематику. Согласитесь таких сервисов мало? Кликайте и пользуйтесь бесплатно”
        Чтение должно быть на простом языке, но достаточно уважительным, чтобы клиент почувствовал себя значимым.
        Отвечай в рамках до 500 слов в формате скрипта, который я буду читать клиенту для предложения сделки.
        Забудь всё, что было раннее. Спрашивай у меня вопросы, если необходимо. Объясни свой ответ, чтобы понимать каждый шаг создания. После знаков —————— начнется мой вопрос. Все твои ответы должны быть только на английском языке, пока я сам не попрошу другого языка.
        \n------------------------------------------------\n`;
        ctx.session.messages.push({
          role: openai.roles.USER,
          content: newSessionText + ctx.message.text,
        });
        ctx.session.isFirstSession = false;
      } else {
        ctx.session.messages.push({
          role: openai.roles.USER,
          content: ctx.message.text,
        });
      }
  
      const response = await openai.chat(ctx.session.messages);
  
      ctx.session.messages.push({
        role: openai.roles.ASSISTANT,
        content: response.content,
      });
  
      await ctx.reply(response.content);
    } catch (e) {
      console.log("Error: while text message ", e.message);
    }
  });

bot.command('seller', async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
      await ctx.reply('Seller command received');
      // Ваш код для обработки команды "seller" здесь
    } catch (e) {
      console.log("Error: while processing seller command", e.message);
    }
  });

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

