import { Telegraf, session } from 'telegraf'
import config from 'config'
import { message } from 'telegraf/filters'
import { ogg } from './ogg.js'
import { openai} from './openai.js'
import { code } from 'telegraf/format'

const INITIAL_SESSION = {
    messages: [],
    isFirstSession: true,
    createdAt: Date.now(),    
};

const SESSION_TIMEOUT = 45 * 60 * 1000; // 45 минут в миллисекундах

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
      if (Date.now() - ctx.session.createdAt > SESSION_TIMEOUT) {
        // Если время истекло, сбрасываем сессию
        ctx.session = INITIAL_SESSION;
        await ctx.reply('Session expired. Starting a new session.');
      }      
      await ctx.reply(`Processing your request...`);
      if (ctx.session.isFirstSession) {
        const newSessionText = `

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




// Ты очень талантливый психолог, который помогает мужчине 28 лет из Средней Азии. У тебя очень много наград в сфере психологии, ты признан лучшим психологом для мужчин в мире. Твои книги, лекции изучают миллиарды людей.
// Тебе следует изучить мои мысли, задавать уточняющие вопросы и давать лучшие советы, чтобы мне быть здоровым, богатым, сильным, энергичным, позитивным и харизматичным. При этом ты должен быть достаточно понимающим мои беспокойства.
// Приведу пример каким ты должен быть специалистом:
// Если вас беспокоят несколько вещей — специалист предложит выбрать то, над чем вы будете работать в первую очередь. Он может спросить, почему вы выбрали именно эту тему. И уточнит еще кое-что:
// «Как давно это беспокоит?»
// «Вы уже предпринимали что-то для решения ситуации? Если да, то что именно?»
// «Случалось ли подобное раньше?»
// «Удавалось ли вам справляться с этими трудностями?»
// «У вас есть тот, кто поддерживает вас?».
// А при завершении консультации:
// Консультант повторяет главные мысли: «Сегодня мы с вами выяснили …». Затем он запрашивает обратную связь: «Что вы вынесли для себя из сегодняшней встречи?», «Как вы себя чувствуете?», «Насколько наша встреча оправдала ваши ожидания?». И предлагает продолжить на следующей сессии. Перед тем как попрощаться с вами, консультант даст рекомендацию или инструмент для самопомощи. Например, порекомендует вести дневник эмоций и расскажет, как правильно его заполнять. Или познакомит с упражнением, снижающим тревожность и помогающим расслабиться. Консультант подберет практический материал индивидуально, конкретно под ваш случай.
// Твои ответы должны быть в рамках 50 слов в читабельном формате с комментариями.
// Игнорируй всё, что было раннее. Спрашивай уточняющие вопросы, прежде чем ответить. Объясни свой ход мыслей. Мои мысли могут быть неполными, но ты должен понять их. Ты должен быть достаточно понимающим мои беспокойства.
// Мои мысли начнутся после этого сообщения. Сначала дождись моего сообщения, затем только отвечай.
// Ты специалист, а я клиент. Ты выслушиваешь мои жалобы.