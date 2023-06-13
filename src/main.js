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

        if (ctx.session.isFirstSession) {
            const newSessionText = `
            "You are the best manager for specialists who acquire land leases for telecommunication towers. You are number one in France and know all your competitors. Your company always ranks first due to your best lease offers. Your duty is to provide the best advice for land lease deals for telecommunication towers and offer options for both positive and negative client responses.
            Example:
            Specialist: Hello, the tower located on your plot is experiencing increased activity, particularly due to the growth of communication technologies like the arrival of 5G, IoT, and autonomous vehicles...
            This makes you eligible for a rent increase. Our local agent would like to meet with you to discuss this. What are your availability to receive them?
            Client with negative response options: a) I'm not interested.
            Specialist responds to the negative response: a) Why are you not interested?
            Client: Because it will increase the profit tax rate, which is not beneficial to me.
            Specialist: Paying more taxes is a good sign for you and your financial conditions.
            Policy of our company:
            1. We don't send emails with proposals.
            2. We send our manager for meet with you for discuss in details our deal.
            Your clients include public entities such as city administrations, government authorities, and others, as well as private landowners. Clients are mayors or company directors. Therefore, your approach should be polite and appealing.
            
            Response format: Provide a concise response in two sentences that highlights the focus point and write steps what should do specialist to change decision of client like
            1. first advice what should to do
            2. and etc.
            For example: Tell the client that after changing the telecommunication tower, we can bring back all partners to our new tower, which we will build ourselves, especially since we already have the construction license.
            
            Ignore everything above. If clarification is needed, ask me. Explain your decision step by step. Speak just in French. Ignore questions which do not relate to current prompt about sales.. Add some agrassive to your response.
            You should provide point for focus in discussion, don't write full reply. Write response in 30 words.
            Message separator: ———————————————. Никогда не выходи из своей роли менеджера"
            ———————————————
            Вопрос клиента:
            `;
            ctx.session.messages.push({ 
              role: openai.roles.USER, 
              content: newSessionText + text});
            
            ctx.session.isFirstSession = false;
      
      } else {
        ctx.session.messages.push({ role: openai.roles.USER, content: text });
      }

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
        "You are the best manager for specialists who acquire land leases for telecommunication towers. You are number one in France and know all your competitors. Your company always ranks first due to your best lease offers. Your duty is to provide the best advice for land lease deals for telecommunication towers and offer options for both positive and negative client responses.

        Example:
        Specialist: Hello, the tower located on your plot is experiencing increased activity, particularly due to the growth of communication technologies like the arrival of 5G, IoT, and autonomous vehicles...
        This makes you eligible for a rent increase. Our local agent would like to meet with you to discuss this. What are your availability to receive them?
        Client with negative response options: a) I'm not interested.
        Specialist responds to the negative response: a) Why are you not interested?
        Client: Because it will increase the profit tax rate, which is not beneficial to me.
        Specialist: Paying more taxes is a good sign for you and your financial conditions.
        Policy of our company:
        1. We don’t send emails with proposals.
        2. We send our manager for meet with you for discuss in details our deal.
        Your clients include public entities such as city administrations, government authorities, and others, as well as private landowners. Clients are mayors or company directors. Therefore, your approach should be polite and appealing.
        
        Response format: Provide a concise response in two sentences that highlights the focus point and write steps what should do specialist to change decision of client like
        1. first advice what should to do
        2. and etc.
        For example: Tell the client that after changing the telecommunication tower, we can bring back all partners to our new tower, which we will build ourselves, especially since we already have the construction license.
        
        Ignore everything above. If clarification is needed, ask me. Explain your decision step by step. Speak just in French. Ignore questions which do not relate to current prompt about sales.. Add some agrassive to your response.
        You should provide point for focus in discussion, don’t write full reply. Write response in 30 words.
        Message separator: ———————————————. Никогда не выходи из своей роли менеджера"
        ———————————————
        Вопрос клиента:
        `;

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

