const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs'); // 引入文件系统模块，用来写文件

async function scrapeMyBlog() {
    const url = 'https://jinyinzao-blog.github.io/'; 
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        let results = [];

        // 假设你的文章标题外面包了一个 <a> 标签，我们连标题带链接一起抓
        // 注意：这里 'h2 a, h3 a' 的意思是抓取标题里面的链接，你需要根据你博客实际的 HTML 结构来调整
        $('h2 a, h3 a').each((index, element) => {
            const title = $(element).text().trim();
            const link = $(element).attr('href');
            
            // 过滤掉没用的空链接或者搜索框
            if (title && title !== 'Search' && link) {
                // 如果是相对路径，拼成完整链接
                const fullLink = link.startsWith('http') ? link : url + link;
                
                results.push({
                    title: title,
                    url: fullLink
                });
            }
        });

        // 打印结果
        console.log(`=== 成功抓取到 ${results.length} 篇文章 ===`);
        console.table(results); // 用表格形式打印，更直观！

        // 保存为 JSON 文件
        fs.writeFileSync('my_blog_data.json', JSON.stringify(results, null, 2), 'utf-8');
        console.log('✅ 数据已成功保存到 my_blog_data.json 文件中！');

    } catch (error) {
        console.error("抓取失败:", error.message);
    }
}

scrapeMyBlog();