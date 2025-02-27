const repository = process.env.GITHUB_REPOSITORY;
const fs = require('fs');   
const path = require('path');

const webtitle = `my gallery`;
const cdn = `https://cdn.jsdelivr.net/gh/${repository}`;

// 读取图片文件夹
const imgdir = `images`;
const outdir = `output`;
const imagesDir = path.join(__dirname, imgdir);
const outputDir = path.join(__dirname, outdir);



// 获取指定文件夹下的所有图片及其标签
function getImages(folderPath) {
    const files = fs.readdirSync(folderPath);
    return files
        .filter(file => /\.(jpg|jpeg|png|gif|webp|avif)$/.test(file))
        .map(file => {
            const basename = path.basename(file, path.extname(file)); // 去掉扩展名
            const fileParts = basename.split('-'); // 按照“-”分割文件名
            const tags = fileParts.slice(0); // 小于或者等于 整数 则不显示

            return { name: file, tags }; // 返回文件名、标签
        })
}

// HTML head
function htmlhead(){
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>image-${webtitle}</title>
    <style>
            /* 通用样式 */
            body {
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            h1 {
                margin-bottom: 20px;
            }

            .tag-cloud {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-bottom: 20px;
                justify-content: center;
            }

            .tag-cloud a {
                padding: 5px 10px;
                border-radius: 5px;
                text-decoration: none;
                font-weight: 500;
                transition: background-color 0.3s, color 0.3s;
            }

            .tag-cloud a:hover {
                opacity: 0.8;
            }

            .tag-cloud a.selected {
                color: #ffffff;
            }

            .gallery {
                column-gap: 15px; 
                max-width: 90%;
                margin: 0 auto;
            }
            /* 响应式瀑布流 */
            @media (min-width: 600px) {
                .gallery {
                    column-count: 2; /* 平板设备 2 列 */
                }
            }

            @media (min-width: 900px) {
                .gallery {
                    column-count: 3; /* 小型电脑 3 列 */
                }
            }

            @media (min-width: 1200px) {
                .gallery {
                    column-count: 4; /* 大型电脑 4 列 */
                }
            }
            .gallery-item {
                margin-bottom: 15px; /* 控制项之间的垂直间距 */
                break-inside: avoid; /* 防止元素拆分到不同列 */
                position: relative;
                overflow: hidden;
                border-radius: 8px;
                transition: transform 0.3s;
                cursor: pointer;
            }

            .gallery-item:hover {
                transform: scale(1.05);
            }

            .gallery-item img {
                width: 100%;
                height: auto;
                display: block;
                border-radius: 8px;
            }

            /* 懒加载 */
            .lazy {
                opacity: 0;
                transition: opacity 0.3s ease-in;
            }

            .lazy-loaded {
                opacity: 1;
            }

            /* 灯箱样式 */
            #lightbox {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }

            #lightbox img {
                max-width: 90%;
                max-height: 90%;
                transform-origin: center center;
                transition: none;
            }

            /* 明亮模式样式 */
            @media (prefers-color-scheme: light) {
                body {
                    background-color: #f5f5f5;
                    color: #333;
                }

                h1 {
                    color: #333;
                }

                .tag-cloud a {
                    color: #333;
                    background-color: #e0e0e0;
                }

                .tag-cloud a.selected {
                    background-color: #6200ea;
                    color: #ffffff;
                }

                .gallery-item {
                    background-color: #f5f5f5;
                }
            }

            /* 暗黑模式样式 */
            @media (prefers-color-scheme: dark) {
                body {
                    background-color: #121212;
                    color: #ffffff;
                }

                h1 {
                    color: #f5f5f5;
                }

                .tag-cloud a {
                    color: #b0bec5;
                    background-color: #333;
                }

                .tag-cloud a.selected {
                    background-color: #6200ea;
                    color: #ffffff;
                }

                .gallery-item {
                    background-color: #333;
                }
            }
            /* 返回主页按钮样式 */
            .back-button {
                display: inline-block;
                margin-bottom: 20px;
                padding: 10px 20px;
                background-color: #333;
                color: #ffffff;
                text-decoration: none;
                font-size: 16px;
                border-radius: 5px;
                transition: background-color 0.3s ease;
            }
            
            /* 鼠标悬停时的按钮效果 */
            .back-button:hover {
                background-color: #555;
            }

            .cover-image-container {
                position: relative;
                display: block;
            }

            .cover-image {
                width: 100%;
                height: auto;
            }

            .cover-image:hover {
                transform: scale(1.05); /* 图片悬停时放大 */
            }

            /* 蒙版效果 */
            .overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s;
            }

            .gallery-item:hover .overlay {
                opacity: 1; /* 鼠标悬停时显示蒙版 */
            }

            .folder-name {
                font-size: 20px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
            }


        </style>
</head>`
}

function htmlscript(){
    return `
    <script>
        let selectedTags = [];

        document.addEventListener("DOMContentLoaded", function() {
            lazyLoadImages();
        });

        // 懒加载函数
        function lazyLoadImages() {
            const lazyImages = document.querySelectorAll('.lazy');
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const dataSrc = img.dataset.src; // 获取 data-src 属性

                        if (dataSrc) {
                            img.src = dataSrc; // 设置图片的 src 属性
                            img.classList.add('lazy-loaded');
                            observer.unobserve(img); // 停止观察该图片，避免重复加载
                        }
                    }
                });
            }, { root: null, rootMargin: "0px", threshold: 0.1 });

            lazyImages.forEach(image => observer.observe(image)); // 观察所有懒加载图片
        }

        // 打开灯箱
        function openLightbox(event) {
            const lightbox = document.getElementById('lightbox');
            const lightboxImage = document.getElementById('lightbox-image');
            const img = event.currentTarget.querySelector('img');
            
            lightboxImage.src = img.src;
            lightbox.style.display = 'flex';
        }

        // 关闭灯箱
        function closeLightbox() {
            document.getElementById('lightbox').style.display = 'none';
        }

        function selectTag(tag, element) {
            const index = selectedTags.indexOf(tag);
            if (index === -1) {
                selectedTags.push(tag);
                element.classList.add('selected');
            } else {
                selectedTags.splice(index, 1);
                element.classList.remove('selected');
            }

            filterImages();
            updateTagCloud();
        }

        function filterImages() {
            const galleryItems = document.querySelectorAll('.gallery-item');
            let hasVisibleImages = false;

            galleryItems.forEach(item => {
                const itemTags = item.dataset.tags.split(' ');
                const matches = selectedTags.every(tag => itemTags.includes(tag));

                if (matches) {
                    item.style.visibility = 'visible';
                    item.style.position = 'static';
                    hasVisibleImages = true;
                } else {
                    item.style.visibility = 'hidden';
                    item.style.position = 'absolute';
                }
            });

            document.getElementById('gallery').style.display = hasVisibleImages ? 'block' : 'none';
        }

        function updateTagCloud() {
            const remainingTags = new Map(); // 使用 Map 来存储标签及其计数
            const galleryItems = document.querySelectorAll('.gallery-item');

            // 统计每个标签的出现次数
            galleryItems.forEach(item => {
                const itemTags = item.dataset.tags.split(' ');
                if (selectedTags.every(tag => itemTags.includes(tag))) {
                    itemTags.forEach(tag => {
                        remainingTags.set(tag, (remainingTags.get(tag) || 0) + 1); // 计数
                    });
                }
            });

            // 对剩余标签按数量排序，并过滤掉数量为 1 的标签
            const sortedRemainingTags = Array.from(remainingTags)
                //.filter(([tag, count]) => count > 1) // 过滤掉计数为 1 的标签
                .sort((a, b) => b[1] - a[1]);

            const tagCloud = document.getElementById('tag-cloud');
            tagCloud.innerHTML = sortedRemainingTags.map(([tag, count]) =>
                \`<a href="#" onclick="selectTag('\${tag}', this)" class="\${selectedTags.includes(tag) ? 'selected' : ''}">\${tag} (\${count})</a>\`
            ).join(' ');
        }
    </script>
    </html>`
}
// 生成 HTML 内容
function generateHTML(images, folderName) {
    // 生成标签云
    const tagCloud = {};
    images.forEach(img => {
        img.tags.forEach(tag => {
            tagCloud[tag] = (tagCloud[tag] || 0) + 1;
        });
    });
    const sortedTags = Object.entries(tagCloud).sort((a, b) => b[1] - a[1]);

    return htmlhead()+`
<body>
    <!-- 返回主页按钮 -->
    <a href="index.html" class="back-button">Go Back</a>
    <br>
    <h1>${folderName}</h1>
    <div id="tag-cloud" class="tag-cloud">
        ${sortedTags.map(([tag, count]) => `
            <a href="#" onclick="selectTag('${tag}', this)">${tag} (${count})</a>
        `).join('')}
    </div>
    <div id="gallery" class="gallery">
        ${images.map(image => `
            <div class="gallery-item" data-tags="${image.tags.join(' ')}" onclick="openLightbox(event)">
                <img data-src="${cdn}/${imgdir}/${folderName}/${image.name}" alt="${image.name}" title="${image.name}" class="lazy">
            </div>
        `).join('')}
    </div>
    <div id="lightbox" onclick="closeLightbox()">
        <img id="lightbox-image" src="" alt="Lightbox Image" draggable="false">
    </div>
</body>
`+htmlscript();
}

// 遍历 images 文件夹中的子文件夹，并生成 HTML 文件
function generateHTMLForAllFolders() {
    fs.mkdirSync(outputDir, { recursive: true });
    const folders = fs.readdirSync(imagesDir).filter(folder => fs.statSync(path.join(imagesDir, folder)).isDirectory());

    folders.forEach(folder => {
        const folderPath = path.join(imagesDir, folder);
        const images = getImages(folderPath);
        const htmlContent = generateHTML(images, folder);
        const outputFile = path.join(outputDir, `${folder}.html`);
        fs.writeFileSync(outputFile, htmlContent);
        console.log('HTML 文件生成完成:', outputFile);
    });
}

function generateIndexHTML() {
    // 读取 images 文件夹中的所有子文件夹
    const folders = fs.readdirSync(imagesDir).filter(folder => fs.statSync(path.join(imagesDir, folder)).isDirectory());

    let indexHTML = htmlhead() + `
    <body>
        <h1>${webtitle}</h1>
        <div id="folder-gallery" class="gallery">`;

    folders.forEach(folder => {
        const folderPath = path.join(imagesDir, folder);
        
        // 获取文件夹中的所有图片
        const images = getImages(folderPath);
        if (images.length === 0) return; // 如果文件夹中没有图片，跳过

        // 尝试找到封面图片
        let coverImage = images.find(img => img.name.toLowerCase().includes('cover'));
        
        // 如果没有封面图片，随机选择一张图片作为封面
        if (!coverImage) {
            coverImage = images[Math.floor(Math.random() * images.length)];
        }

        indexHTML += `
        <div class="gallery-item">
            <a href="${folder}.html">
                <div class="cover-image-container">
                    <img src="${cdn}/${imgdir}/${folder}/${coverImage.name}" alt="${coverImage.name}" class="cover-image">
                    <div class="overlay">
                        <span class="folder-name">${folder}</span>
                    </div>
                </div>
            </a>
        </div>`;
    });

    indexHTML += `
        </div>
    </body>
    </html>`;

    // 将生成的 HTML 写入 index.html 文件
    const outputFile = path.join(outputDir, 'index.html');
    fs.writeFileSync(outputFile, indexHTML);
    console.log('index.html 生成完成:', outputFile);
}




generateIndexHTML()
generateHTMLForAllFolders();