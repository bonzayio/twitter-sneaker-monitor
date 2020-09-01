const discord = require('discord.js');

/**
 * Wrapper function for sending Discord embeds
 * @param {Object} Object.webhookUrl Discord webhook URL
 * @param {Object} Object.description Description of the embed
 * @param {Object} Object.storeName Name of a store
 * @param {Object} Object.productName Name of a product
 * @param {Object} Object.productUrl URL
 * @param {Object} Object.productImage Image
 */
const sendDiscordWebhook = async ({
  webhookUrl,
  description,
  storeName,
  productName,
  productUrl,
  productImage,
}) => {
  const [, , , , , id, token] = webhookUrl.split('/');
  const hook = new discord.WebhookClient(id, token);
  const embed = new discord.MessageEmbed();

  if (storeName) embed.setAuthor(storeName, undefined, undefined);
  if (description) embed.setDescription(description);

  embed
    .setColor('#ffaaaa')
    .setFooter(
      'Twitter Bricks by @rtunazzz',
      'https://media.discordapp.net/attachments/683591452214820909/748503709452861450/rtuna_logo.png',
    );

  if (productName) embed.setTitle(productName);
  if (productUrl) embed.setURL(productUrl);
  if (productImage) embed.setImage(productImage);

  return hook
    .send({
      embeds: [embed],
    })
    .catch((err) => {
      console.log(`Failed to send a notification! ${err}`);
    });
};

/**
 * Removes trash character from the text passed in.
 * @param {String} text Text to remove the characters from
 * @returns {String}
 */
const removeTrashCharacters = (text) => {
  // could be done more effectively but CBA

  let newText = text;
  newText = newText.replace('\n=&gt;', '');
  newText = newText.replace('=&gt;', '');
  newText = newText.replace('&gt;', '');
  newText = newText.replace('&gt; ', '');
  newText = newText.replace('#AD', '');
  newText = newText.replace('AD:', '');
  newText = newText.replace('Ad:', '');
  newText = newText.replace('AD :', '');
  newText = newText.replace('AD', '');
  newText = newText.replace('=> ', '');
  newText = newText.replace('=>', '');
  newText = newText.replace('&gt; ', '');
  newText = newText.replace('Link >', '');
  // newText = newText.replace(/[^\w\s]/gi, '');
  return newText;
};

/**
 * Replaces all URLs in a text with neat discord embed formatting of [Click here](URL)
 * @param {*} text - Text to edit
 * @param {*} urls - urls to replace
 * @returns {String} - text with the URLs replaced
 */
const replaceUrlsInText = (text, urls) => {
  /** Prettify the text */
  let editedText = text;
  for (let i = 0; i < urls.length; i += 1) {
    const { url } = urls[i];
    const expandedUrl = urls[i].expanded_url;
    /** Last URL in urls is always the tweet link. We remove it from the text completely */
    editedText = editedText.replace(url, ` [Click here](${expandedUrl})`);
  }
  return editedText;
};

/**
 * Removes mentions from a string.
 * @param {String} text Text to remove mentions from
 * @param {Object} mentions Mentions to remove
 */
const removeMentions = (text, mentions) => {
  let editedText = text;
  for (let i = 0; i < mentions.length; i += 1) {
    const mention = mentions[i];
    editedText = editedText.replace(`@${mention.screen_name}`, '');
  }
  return editedText;
};

module.exports = {
  sendDiscordWebhook,
  removeTrashCharacters,
  replaceUrlsInText,
  removeMentions,
};
