const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://books.toscrape.com/catalogue/page-';
const TOTAL_PAGES = 2; // 详情页抓取比较慢，为了演示，我们先抓 2 页

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 伪装成真实的浏览器，防止被简单的反爬机制拦截
const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function scrapeDetailedBooks() {
    let allBooks = [];
    console.log(`🚀 开始深度抓取 ${TOTAL_PAGES} 页书籍...`);

    for (let page = 1; page <= TOTAL_PAGES; page++) {
        const url = `${BASE_URL}${page}.html`;
        console.log(`\n正在扫描第 ${page} 页...`);

        try {
            const { data } = await axios.get(url, { headers });
            const $ = cheerio.load(data);

            // 获取当前页所有书籍详情页的相对链接
            const bookLinks = [];
            $('.product_pod h3 a').each((i, el) => {
                bookLinks.push($(el).attr('href'));
            });

            // 遍历进去抓详情
            for (let i = 0; i < bookLinks.length; i++) {
                // 拼接详情页绝对路径 (注意相对路径的拼接)
                const detailUrl = bookLinks[i].replace('../../../', 'https://books.toscrape.com/catalogue/');
                
                console.log(`  [${i + 1}/${bookLinks.length}] 正在抓取: ${detailUrl}`);
                
                try {
                    const detailRes = await axios.get(detailUrl, { headers });
                    const d$ = cheerio.load(detailRes.data);

                    // 提取详情页的高阶数据
                    const title = d$('.product_main h1').text().trim();
                    const price = d$('.product_main .price_color').text().trim();
                    const upc = d$('table.table-striped tr:nth-child(1) td').text().trim();
                    const stock = d$('table.table-striped tr:nth-child(6) td').text().trim();
                    
                    // 提取描述（如果存在的话）
                    const description = d$('#product_description').next('p').text().trim() || '暂无描述';

                    allBooks.push({
                        title,
                        price,
                        upc,
                        stock,
                        description: description.substring(0, 100) + '...' // 截取前100字
                    });

                    // 每次抓详情页休息 500ms，不要太猛
                    await delay(500); 
                } catch (err) {
                    console.log(`  ❌ 详情页抓取失败: ${err.message}`);
                }
            }
        } catch (error) {
            console.error(`❌ 列表页抓取失败:`, error.message);
        }
    }

    console.log(`\n🎉 深度抓取完毕！共获取 ${allBooks.length} 本书的完整信息。`);
    
    // 保存数据
    fs.writeFileSync('books_detailed.json', JSON.stringify(allBooks, null, 2), 'utf-8');
    console.log('📁 数据已保存到 books_detailed.json 文件中！');
}

scrapeDetailedBooks();