// index.js
const puppeteer = require('puppeteer');
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = '8588759611:AAGIjtjDDbIjzh6_IP5erJa7OmXzCVg2maM';
const CHAT_ID = '1186941518';

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

const SEARCH_CONFIG = [
  // 💪 Gorilla Wear
  {
    name: 'Gorilla Wear XL',
    query: 'Gorilla Wear mężczyźni XL',
    maxPrice: 200,
    conditions: ['Nowy z metką', 'Nowy bez metki', 'Bardzo dobry']
  },
  {
    name: 'Pas kulturystyczny Gorilla',
    query: 'pas kulturystyczny Gorilla Wear', 
    maxPrice: 250,
    conditions: ['Nowy z metką', 'Nowy bez metki']
  },
  
  // 👟 Кроссовки
  {
    name: 'Nike Air 45',
    query: 'Nike Air 45 OR 45,5',
    maxPrice: 220,
    conditions: ['Nowy z metką', 'Nowy bez metki'],
    sizeFilter: ['45', '45,5', '45.5']
  },
  {
    name: 'Asics Gel NYC 45',
    query: 'Asics Gel NYC 45 OR 45,5', 
    maxPrice: 220,
    conditions: ['Nowy z metką', 'Nowy bez metki'],
    sizeFilter: ['45', '45,5', '45.5']
  },
  
  // 📚 КНИГИ ПСИХОЛОГИЯ - ВСЕ ПО-РУССКИ! ≤22zł
  {
    name: 'Тонкое искусство пофигизма',
    query: '"Тонкое искусство пофигизма" OR "Искусство пофигизма"',
    maxPrice: 22,
    conditions: ['Nowy z metką', 'Nowy bez metki', 'Bardzo dobry'],
    isBook: true,
    russianFilter: true
  },
  {
    name: '12 правил жизни',
    query: '"12 правил жизни" OR "Двенадцать правил жизни"',
    maxPrice: 22,
    conditions: ['Nowy z metką', 'Nowy bez metki'],
    isBook: true,
    russianFilter: true
  },
  {
    name: 'Атомные привычки',
    query: '"Атомные привычки" OR "Atomic Habits"',
    maxPrice: 22,
    conditions: ['Nowy z metką', 'Nowy bez metki'],
    isBook: true,
    russianFilter: true
  },
  {
    name: 'Сила привычки',
    query: '"Сила привычки" OR "The Power of Habit"',
    maxPrice: 22,
    conditions: ['Nowy z metką', 'Nowy bez metki'],
    isBook: true,
    russianFilter: true
  },
  {
    name: 'Мысли быстрые и медленные',
    query: '"Мысли быстрые и медленные" OR "Thinking Fast and Slow"',
    maxPrice: 22,
    conditions: ['Nowy z metką', 'Bardzo dobry'],
    isBook: true,
    russianFilter: true
  },
  {
    name: 'Монах который продал',
    query: '"Монах который продал" OR "Монах который продал свой феррари"',
    maxPrice: 22,
    conditions: ['Nowy z metką', 'Nowy bez metki'],
    isBook: true,
    russianFilter: true
  },
  {
    name: 'Атланты держат небо',
    query: '"Атланты держат небо"',
    maxPrice: 22,
    conditions: ['Nowy z metką', 'Bardzo dobry'],
    isBook: true,
    russianFilter: true
  },
  {
    name: '7 навыков высокоэффективных',
    query: '"7 навыков высокоэффективных людей"',
    maxPrice: 22,
    conditions: ['Nowy z metką', 'Nowy bez metki'],
    isBook: true,
    russianFilter: true
  },
  {
    name: 'Как завоевывать друзей',
    query: '"Как завоевывать друзей" OR "Дейл Карнеги"',
    maxPrice: 22,
    conditions: ['Nowy z metką', 'Bardzo dobry'],
    isBook: true,
    russianFilter: true
  },
  {
    name: 'Богатый папа бедный папа',
    query: '"Богатый папа бедный папа"',
    maxPrice: 22,
    conditions: ['Nowy z metką', 'Nowy bez metki'],
    isBook: true,
    russianFilter: true
  }
];

const sentItems = new Set();

async function monitorVinted() {
  console.log('\n🕐', new Date().toLocaleString('pl-PL'), '\n');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    for (const config of SEARCH_CONFIG) {
      console.log(`🔍 ${config.name.padEnd(35)} ≤${config.maxPrice}zł`);
      
      await page.goto(`https://www.vinted.pl/catalog?search_text=${encodeURIComponent(config.query)}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      await autoScroll(page);
      
      const items = await page.evaluate((config) => {
        const allItems = Array.from(document.querySelectorAll('[data-testid="grid-item"]'));
        return allItems.slice(0, 30).map(item => {
          const linkEl = item.querySelector('a[href*="/items/"]');
          const idMatch = linkEl?.href?.match(/\/items\/(\d+)/);
          
          const priceEl = item.querySelector('[data-testid*="price-text"]');
          const priceText = priceEl?.textContent?.trim();
          const priceNum = priceText ? parseFloat(priceText.replace(/[ zł,]/g, '').replace(',', '.')) : 999;
          
          const fullText = item.textContent;
          const conditionMatch = fullText.match(/(Nowy z metką|Nowy bez metki|Bardzo dobry)/i);
          
          const sizeMatch = fullText.match(/(45|45,5|45\.5)/i);
          const size = sizeMatch ? sizeMatch[1] : null;
          
          const hasRussian = /[\u0400-\u04FF]/.test(fullText);
          const isBook = /książ|книг|книга|book/i.test(fullText);
          
          return {
            id: idMatch ? idMatch[1] : null,
            title: item.querySelector('[data-testid*="description-title"]')?.textContent?.trim() || '',
            subtitle: item.querySelector('[data-testid*="description-subtitle"]')?.textContent?.trim() || '',
            price: priceText || '',
            priceNum,
            link: linkEl?.href || '',
            image: item.querySelector('img')?.src || '',
            condition: conditionMatch ? conditionMatch[1] : '',
            size,
            hasRussian,
            isBook
          };
        })
        .filter(item => 
          item.id && 
          item.priceNum <= config.maxPrice && item.priceNum >= 1 &&
          config.conditions.some(cond => item.condition?.includes(cond)) &&
          (!config.sizeFilter || config.sizeFilter.some(s => item.size?.includes(s))) &&
          (!config.isBook || item.isBook) &&
          (!config.russianFilter || item.hasRussian)
        )
        .sort((a, b) => a.priceNum - b.priceNum);
      }, config);

      const newItems = items.filter(item => !sentItems.has(item.id));
      console.log(`   ✅ ${items.length} всего | ${newItems.length} новых`);

      for (const item of newItems.slice(0, 2)) {
        await sendTelegramNotification(item, config.name);
        sentItems.add(item.id);
      }
    }
    
  } catch (error) {
    console.error('💥', error.message);
  } finally {
    await browser.close();
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    for (let i = 0; i < 3; i++) {
      window.scrollBy(0, window.innerHeight);
      await new Promise(r => setTimeout(r, 1000));
    }
  });
}

async function sendTelegramNotification(item, searchName) {
  const message = `📚 *${item.title}*\n${item.subtitle || ''}\n💎 *${item.price}*\n📊 ${item.condition}\n🔍 ${searchName}\n🔗 ${item.link}`;
  
  try {
    await bot.sendPhoto(CHAT_ID, item.image, {
      caption: message,
      parse_mode: 'Markdown'
    });
    console.log(`📱✅ ${item.price.padStart(6)}zł | ${searchName}`);
  } catch (e) {
    console.log('📱❌', e.message);
  }
}

setInterval(monitorVinted, 8 * 60 * 1000);
monitorVinted();
console.log('🤖 ПО-РУССКИ! 14 категорий! Запущен!');
