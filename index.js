const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// 基础 URL
const BASE_URL = 'https://books.toscrape.com/catalogue/page-';
const TOTAL_PAGES = 3; // 我们只抓前 3 页作为测试

// 延迟函数，防止请求过快被封
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeBooks() {
    let allBooks = [];
    console.log(`🚀 开始抓取 ${TOTAL_PAGES} 页书籍数据...`);

    for (let page = 1; page <= TOTAL_PAGES; page++) {
        const url = `${BASE_URL}${page}.html`;
        console.log(`\n正在抓取第 ${page} 页: ${url}`);

        try {
            // 1. 发起请求
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            // 2. 找到所有的书籍卡片
            const bookElements = $('.product_pod');

            bookElements.each((index, element) => {
                // 提取书名 (在 h3 下的 a 标签的 title 属性里)
                const title = $(element).find('h3 a').attr('title');
                
                // 提取价格 (在带有 price_color 类的 p 标签里)
                const price = $(element).find('.price_color').text().trim();
                
                // 提取评分 (带有 star-rating 类的 p 标签，它的 class 里包含评分等级)
                const ratingClass = $(element).find('.star-rating').attr('class');
                // 例如 "star-rating Three"，我们把前面的删掉，只留 "Three"
                const rating = ratingClass.replace('star-rating ', '');

                allBooks.push({
                    title,
                    price,
                    rating
                });
            });

            console.log(`✅ 第 ${page} 页抓取完成，当前共获取 ${allBooks.length} 本书。`);

            // 每次翻页前休息 1.5 秒
            if (page < TOTAL_PAGES) {
                console.log("等待 1.5 秒后翻页...");
                await delay(1500);
            }

        } catch (error) {
            console.error(`❌ 第 ${page} 页抓取失败:`, error.message);
        }
    }

    // 3. 数据保存与展示
    console.log('\n====================================');
    console.log(`🎉 全部抓取完毕！共获取 ${allBooks.length} 本书。`);
    
    // 打印前 5 本书看看效果
    console.log("预览前 5 本：");
    console.table(allBooks.slice(0, 5));

    // 4. 写入 JSON 文件
    fs.writeFileSync('books_data.json', JSON.stringify(allBooks, null, 2), 'utf-8');
    console.log('📁 数据已成功保存到 books_data.json 文件中！');
}

// 启动爬虫
scrapeBooks();