import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv'
dotenv.config() 

const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

const sendToDiscord = async (url, title) => {
    const embed = {
      title: 'Site Crawlé',
      description: "Détails du site crawlé",
      fields: [
        {
          name: 'URL',
          value: url,
          inline: true,
        },
        {
          name: 'Titre',
          value: title,
          inline: true,
        },
      ],
      color: 0x00ff00, 

      timestamp: new Date(),
    };
  
    try {
      await axios.post(discordWebhookUrl, {
        embeds: [embed],
      });
      console.log(`Message envoyé à Discord : URL - ${url}, Titre - ${title}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi au Webhook Discord :', error.message);
    }
  };


  const crawlSite = async (url, visited) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);


    const title = $('title').text();
    console.log(`Titre trouvé : ${title}`);
    await sendToDiscord(url, title);


    const links = [];
    $('a[href]').each((_, element) => {
      const link = $(element).attr('href');
      if (link && !visited.has(link)) {
        const absoluteLink = new URL(link, url).href; 
        links.push(absoluteLink);
      }
    });

    return links;
  } catch (error) {
    console.error(`Erreur lors du crawl de ${url} :`, error.message);
    await sendToDiscord(`Erreur lors du crawl de ${url} : ${error.message}`);
    return [];
  }
};

const startCrawler = async (initialSites, maxDepth = 2) => {
  const visited = new Set();
  const queue = initialSites.map((site) => ({ url: site, depth: 0 }));

  while (queue.length > 0) {
    const { url, depth } = queue.shift();

    if (visited.has(url) || depth > maxDepth) {
      continue;
    }

    visited.add(url);
    console.log(`Crawling : ${url} (Profondeur : ${depth})`);

    const newLinks = await crawlSite(url, visited);
    for (const link of newLinks) {
      if (!visited.has(link)) {
        queue.push({ url: link, depth: depth + 1 });
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

const initialSites = [
  'https://news.google.com/home?hl=fr&gl=FR&ceid=FR:fr',
];

startCrawler(initialSites).catch((error) => {
  console.error('Erreur dans le crawler principal :', error.message);
});
