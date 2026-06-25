/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://pubg-sensi.vercel.app',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: ['/api/*'],
}
