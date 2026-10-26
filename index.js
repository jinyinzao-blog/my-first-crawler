const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeMyBlog() {
    const url = 'https://jinyinzao-blog.github.io/'; 
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        let results = [];

        // 抓取所有 a 标签
        $('a').each((index, element) => {
            const title = $(element).text().trim();
            const link = $(element).attr('href');
            
            // 🛡️ 智能过滤逻辑：
            // 1. 标题不能为空，长度最好大于 4
            // 2. 必须存在链接
            // 3. 排除导航栏的特定文字（比如 Search、首页、标签等）
            // 4. 排除 javascript:void(0) 这种死链接
            const ignoreWords = ['Search', '首页', '标签', '归档', '关于', '分类'];
            
            if (title && title.length > 4 && link && !link.startsWith('javascript')) {
                if (!ignoreWords.includes(title)) {
                    // 拼接完整链接
                    const fullLink = link.startsWith('http') ? link : url + link;
                    
                    results.push({
                        title: title,
                        url: fullLink
                    });
                }
            }
        });

        // 去重（因为有些文章标题可能在首页出现两次）
        const uniqueResults = Array.from(new Set(results.map(a => a.url)))
            .map(url => {
                return results.find(a => a.url === url);
            });

        // 打印结果
        console.log(`=== 成功抓取到 ${uniqueResults.length} 篇文章 ===`);
        console.table(uniqueResults);

        // 保存为 JSON 文件
        fs.writeFileSync('my_blog_data.json', JSON.stringify(uniqueResults, null, 2), 'utf-8');
        console.log('✅ 数据已成功保存到 my_blog_data.json 文件中！');

    } catch (error) {
        console.error("抓取失败:", error.message);
    }
}

scrapeMyBlog();