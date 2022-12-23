require('dotenv').config();
const easyvk = require('easyvk');
const express = require('express');
const app = express();
const TelegramBot = require('node-telegram-bot-api');

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

function getBestQualityPhoto(photo) {
	const {
		photo: { sizes },
	} = photo;
	let bestQualityLink = null;
	let max = 0;

	for (const { height, url } of sizes) {
		if (height > max) {
			bestQualityLink = url;
			max = height;
		}
	}

	return bestQualityLink;
}

function doMarkdownBreaks(text){
  return text.replace(/\\n/g, '\n')
}

function doMarkdownLinks(text) {
  return text.replace(/\[(.*?)\|(.*?)\]/g, function(match, p1, p2) {
    return `<a href="${p1}">${p2}</a>`
  });
}

async function messageHandler(msg) {
	const { text, attachments = false } = msg.object;
  const caption = doMarkdownLinks(doMarkdownBreaks(text));

	if (!attachments) return;

	const isMediaGroup = attachments.length > 1;
	if (isMediaGroup) {
		const photos = attachments.map((photo, index) => {
			return {
				type: 'photo',
				media: getBestQualityPhoto(photo),
				caption: index === 0 ? caption : '',
				parse_mode: 'HTML',
        disable_web_page_preview: true
			};
		});
		await bot.sendMediaGroup(process.env.TELEGRAM_CHAT_ID, photos);
	} else {
		await bot.sendPhoto(
      process.env.TELEGRAM_CHAT_ID, 
      getBestQualityPhoto(attachments[0]), 
      {
        caption: caption,
        parse_mode: 'HTML',
        disable_web_page_preview: true
		  }
    );
	}
}
