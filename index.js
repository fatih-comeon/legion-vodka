const { Botkit } = require('botkit')
const { SlackAdapter, SlackEventMiddleware } = require(
  'botbuilder-adapter-slack')
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')

/**
 * Returns the secret string from Google Cloud Secret Manager
 * @param {string} name The name of the secret.
 * @return {string} The string value of the secret.
 */
async function accessSecretVersion (name) {
  const client = new SecretManagerServiceClient()
  const projectId = process.env.K_SERVICE
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/1`
  })

  // Extract the payload as a string.
  const payload = version.payload.data.toString('utf8')

  return payload
}

/**
 * Asynchronous function to initialize bot.
 */
async function botInit () {
  const adapter = new SlackAdapter({
    clientSigningSecret: await accessSecretVersion('client-signing-secret'),
    botToken: await accessSecretVersion('bot-token')
  })

  adapter.use(new SlackEventMiddleware())

  const controller = new Botkit({
    webhook_uri: '/vodka',
    adapter: adapter
  })

  controller.ready(() => {
    console.log("bot ready");
    controller.on('slash_command', async(bot, message) => {
      const params = message.text.split(' ');
      const type = params[0];

      switch (type) {
        case 'buy': {
          const buyer = params[1];
          const vodka = message.text.replace(type, '').replace(buyer, '').trim();
          bot.replyPublic(message, `${buyer} bought ${vodka} on ${new Date().toLocaleDateString()}`);
          break;
        }
        case 'list':
          bot.replyPublic(message, `You used the list command`);
          break;
        default:
          bot.replyPublic(message, `You said "${message.text}" but I don't understand that`);
          break;
      }
    })
  })
}

botInit()