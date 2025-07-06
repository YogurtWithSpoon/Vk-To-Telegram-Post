require('dotenv').config();
const { API, Upload, Updates } = require('vk-io');
const express = require('express');
const app = express();
const TelegramBot = require('node-telegram-bot-api');
const { doMarkdownLinks, doMarkdownBreaks } = require('./helpers/markdown');
const { getBestQualityPhoto } = require('./helpers/utils');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

const http = require('http');
const ngrok = require('@ngrok/ngrok');

const PORT = process.env.PORT || 4000
const {NGROK_AUTH_TOKEN, TELEGRAM_CHAT_ID, GROUP_TOKEN, GROUP_ID, WEBHOOK_SECRET} = process.env;

async function messageHandler(msg) {
	const { text, attachments = [] } = msg;
	
	let caption = doMarkdownLinks(doMarkdownBreaks(text));
	const footerText = `<i>Заказывайте на <a href="https://outlawstore.co">сайте</a> или просто напишите нам в <a href="https://t.me/outlawstore_spb">телеграм</a></i>`
	caption = caption.replace('#outlawstore', footerText);

	const captionOptions = {
		parse_mode: 'HTML',
		disable_web_page_preview: true
	}

	if(attachments.length === 0) {
		return await bot.sendMessage(TELEGRAM_CHAT_ID, caption, captionOptions);
	}

	const isMediaGroup = attachments.length > 1;

	if (isMediaGroup) {
		const photos = attachments.map((photo, index) => {
			return {
				type: 'photo',
				media: getBestQualityPhoto(photo),
				caption: index === 0 ? caption : '',
				...captionOptions,
			};
		});

		await bot.sendMediaGroup(TELEGRAM_CHAT_ID, photos);
	} else {
		await bot.sendPhoto(
			TELEGRAM_CHAT_ID, 
			getBestQualityPhoto(attachments[0]), 
			{
				caption: caption,
				...captionOptions
			}
		);
	}
}

const api = new API({
    token: GROUP_TOKEN,
});

const upload = new Upload({
    api
});

api.groups.getCallbackConfirmationCode({group_id: GROUP_ID}).then(data => {
	const {code} = data;
	
	const updates = new Updates({
		api,
		upload,
		webhookConfirmation: code,
		webhookSecret: WEBHOOK_SECRET,
	});

	updates.on('wall_post_new', async (context) => {
		const post = context.wall;
		await messageHandler(post)
	});

	app.post('/webhook', updates.getWebhookCallback());
})

/* Start Server */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

ngrok
	.connect({ 
		addr: PORT, 
		authtoken: NGROK_AUTH_TOKEN,
		domain: 'magical-seemingly-scorpion.ngrok-free.app',
	})
	.then(listener => console.log(`Ingress established at: ${listener.url()}`));
