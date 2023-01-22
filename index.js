require('dotenv').config();
const easyvk = require('easyvk');
const express = require('express');
const app = express();
const TelegramBot = require('node-telegram-bot-api');
const { doMarkdownLinks, doMarkdownBreaks } = require('./helpers/markdown');
const { getBestQualityPhoto } = require('./helpers/utils');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

easyvk({
  access_token: process.env.GROUP_TOKEN
}).then(async (vk) => {

  let connection = await vk.callbackAPI.listen({
    port: process.env.PORT || 4000,
    path: '/webhook',
    confirmCode: process.env.WEBHOOK_CODE,
    app
  })

  connection.on("wall_post_new", messageHandler);
});

async function messageHandler(msg) {
	const { text, attachments = [] } = msg.object;

	const caption = doMarkdownLinks(doMarkdownBreaks(text));
	const captionOptions = {
		parse_mode: 'HTML',
		disable_web_page_preview: true
	}

	if(attachments.length === 0) {
		return await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, caption, captionOptions);
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

		await bot.sendMediaGroup(process.env.TELEGRAM_CHAT_ID, photos);
	} else {
		await bot.sendPhoto(
			process.env.TELEGRAM_CHAT_ID, 
			getBestQualityPhoto(attachments[0]), 
			{
				caption: caption,
				...captionOptions
			}
		);
	}
}
