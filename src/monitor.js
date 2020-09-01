const Twit = require('twit');

const { twitterConfig, monitorConfig } = require('../configuration/allconfig.js');
const {
  sendDiscordWebhook,
  removeTrashCharacters,
  replaceUrlsInText,
  removeMentions,
} = require('./utils.js');

class Monitor {
  constructor() {
    this.T = new Twit(twitterConfig);
    this.config = monitorConfig;

    this.configureSend();
  }

  configureSend() {
    this.send = ({ productUrl, productImage, description, title }) => {
      sendDiscordWebhook({
        webhookUrl: this.config.webhook,
        productUrl,
        productName: title,
        description,
        productImage,
      }).then(() => { });
    };
  }

  startStream() {
    const stream = this.T.stream('statuses/filter', { follow: this.config.accounts });
    console.log('Monitoring...');
    stream.on('tweet', (tweet) => {
      /** If tweet is retweeted, ignore */
      if (Object.prototype.hasOwnProperty.call(tweet, 'retweeted_status')) {
        // console.log('[TWEET] Found a retweet. Returning.');
        return;
      }

      /** Make sure the Author is the one of the users we are monitoring */
      if (!this.config.accounts.includes(tweet.user.id_str)) {
        return;
      }
      console.log(`[TWEET] Found a tweet from ${tweet.user.screen_name}`);
      // console.log(tweet);

      /** If tweet is reply, ignore */
      if (
        Object.prototype.hasOwnProperty.call(tweet, 'in_reply_to_status_id') &&
        tweet.in_reply_to_status_id
      ) {
        console.log('[TWEET] It is a reply. Returning.');
        return;
      }
      /** If tweet is quoted, ignore */
      if (Object.prototype.hasOwnProperty.call(tweet, 'quoted_status_id')) {
        console.log('[TWEET] It is a quoted tweet.. Returning.');
        return;
      }

      if (
        monitorConfig.filter &&
        !tweet.text.toLowerCase().includes('live') &&
        !tweet.text.toLowerCase().includes('restock')
      ) {
        console.log('[TWEET] Keywords not matched. Returning.');
        return;
      }

      if (
        (tweet.text.toLowerCase().includes('like') &&
          tweet.text.toLowerCase().includes('retweet')) ||
        tweet.text.toLowerCase().includes('for retail')
      ) {
        console.log("[TWEET] It's a giveaway. Returning.");
        return;
      }

      if (tweet.text.toLowerCase().includes('what have you picked up')) {
        console.log("[TWEET] It's a StockX link. Returning.");
        return;
      }

      /** If the Tweet object has an extended tweet,
       * use that (since that contains the whole status) */
      let tweetContent = tweet.text;

      let { media } = tweet.entities;
      let { urls } = tweet.entities;
      if (Object.prototype.hasOwnProperty.call(tweet, 'extended_tweet')) {
        tweetContent = tweet.extended_tweet.full_text;
        urls = tweet.extended_tweet.entities.urls;
        media = tweet.extended_tweet.entities.media;
      }

      if (media === undefined && Object.prototype.hasOwnProperty.call(tweet, 'extended_entities')) {
        console.log('Extended entities');
        media = tweet.extended_entities.media;
      }

      console.log('[TWEET] Getting URLs and Media');
      const mentions = tweet.entities.user_mentions;
      console.log('[TWEET] Formatting URLs');
      const content = replaceUrlsInText(removeMentions(tweetContent, mentions), urls);

      /** Tweet includes the link to the tweet, so we remove it */
      const contentWithoutTweetLink = content.split('https://t.co')[0];

      const tweetToSend = removeTrashCharacters(contentWithoutTweetLink).trim();
      if (tweetToSend.trim() === '') return;

      this.send({
        productUrl: urls && urls[0] ? urls[0].expanded_url : undefined, // Add the first url, only if a title is defined
        productImage: media && media[0] ? media[0].media_url : undefined, // Add an image only if there is one
        description: tweetToSend,
      });
      console.log('[TWEET] Sent to Discord!');
    });
  }
}

module.exports = Monitor;
