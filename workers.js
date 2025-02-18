// =============================
// 需要配置的变量
// =============================
const tokens = ['12E1D403-440B-42A5-819C-B93A5FEE11AC', '21135AD4-25B4-4137-B0AD-BEB80A7F04C9']; //防止直接被扫描访问，这是访问的token

const GITHUB_USERNAME = "user"; // 例如 "myusername"
const GITHUB_REPO = "repo";  // 例如 "myrepo"
const GITHUB_TOKEN = "github_pat"; // 你的 GitHub Personal Access Token
const GITHUB_BRANCH = "main"; // GitHub 仓库的分支名，默认是 "main"
const src = "img"; //路径
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/`; // 自动生成的 GitHub API URL
const DEFAULT_CUSTOM_LINK = `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}`; // 自定义链接前缀，可以为空）

// =============================
// 工具函数
// =============================

/**
 * 将文件的二进制数据转换为 Base64 格式
 * @param {ArrayBuffer} arrayBuffer
 * @returns {string} - Base64 编码的字符串
 */
function arrayBufferToBase64(arrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}

/**
 * 上传文件到 GitHub
 * @param {Uint8Array} fileArrayBuffer - 文件的二进制数据
 * @param {string} filename - 文件名
 * @param {string} path - 存储路径
 * @returns {Promise<string>} - 返回上传后图片的URL
 */
async function uploadToGithub(fileArrayBuffer, filename, path) {
    const base64Content = arrayBufferToBase64(fileArrayBuffer);

    const response = await fetch(`${GITHUB_API_URL}${path}?ref=${GITHUB_BRANCH}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'CloudflareWorker'
        },
        body: JSON.stringify({
            message: `Upload image: ${filename}`,
            content: base64Content,
            branch: GITHUB_BRANCH
        })
    });

    if (response.ok) {
        const data = await response.json();
        return data.content.download_url;
    } else {
        const errorText = await response.text();
        let errorMessage;
        try {
            const errorResponse = JSON.parse(errorText);
            errorMessage = `GitHub API 错误: ${JSON.stringify(errorResponse)}`;
        } catch (e) {
            errorMessage = `${errorText}`;
        }
        throw new Error(errorMessage);
    }
}

/**
 * 获取 GitHub 仓库目录列表
 */
async function getGitHubPaths() {
    console.log('请求路径: ', src);
    const response = await fetch(`${GITHUB_API_URL}/${src}?ref=${GITHUB_BRANCH}`, {
        method: 'get',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/vnd.github+json',
            'User-Agent': 'cloudflare-workers',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    console.log(`${GITHUB_API_URL}/${src}`)
    if (response.ok) {
        const data = await response.json();
        console.log('GitHub API 返回数据:', data);
        return data.filter(item => item.type === 'dir').map(item => item.path);
    } else {
        const errorText = await response.text();
        console.log('GitHub API 错误:', errorText);
        throw new Error('无法获取 GitHub 仓库路径');
    }
    
}

/**
 * 处理 HTTP 请求
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
    const url = new URL(request.url);
    const token = url.pathname.split('/')[1]; 
    if (!tokens.includes(token)) {
        return new Response(JSON.stringify(request.cf, null, 2), {headers: { 'Content-Type': 'application/json' }})
    }

    if (request.method === 'GET') {
        // 获取 GitHub 仓库的路径列表
        const paths = await getGitHubPaths();
        const pathsOptions = paths.map(path => `<option value="${path}">${path}</option>`).join('');

        const htmlPage = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>图床上传</title>
            <style>
            /* 设置全局样式 */
            body {
                width: 80vw;
                margin: 0 auto;
                padding: 20px;
                background-color: black;
                color: #E0E0E0;
                font-family: 'Roboto', sans-serif;
            }
        
            /* 照片墙布局 */
            .preview {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
        
            /* img 样式设置 */
            .preview img {
                width: 100%;
                height: auto;
                display: block;
                border-radius: 8px;
                box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
            }
        
            /* 标题样式 */
            .preview h3 {
                width: 100%;
                font-size: 1.5em;
                font-weight: 500;
                margin: 20px 0;
                text-align: center;
                color: #BB86FC;
            }
        
            /* 输入框、按钮、选择框样式 */
            input, button, select {
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 4px;
                font-size: 1em;
                box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.2);
                outline: none;
                background-color: #333333;
                color: #E0E0E0;
            }
        
            button {
                background-color: #1F78FF;
                color: #FFFFFF;
                cursor: pointer;
                transition: background-color 0.3s;
                width: 100px;
                padding: 8px;
                margin: 10px auto;
                display: block;
                text-align: center;
                border-radius: 4px;
            }
        
            button:hover {
                background-color: #005FCC;
            }
        
            /* 容器布局 */
            .input-group {
                display: flex;
                align-items: center;
                gap: 10px;
            }
        
            .input-group input[type="file"],
            .input-group select {
                flex: 1;
            }
            </style>
        </head>
        <body>
            <h1 align="center">上传图片到 GitHub.io</h1>
            <div class="input-group">
                <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" multiple />
                <label for="customPath">选择路径</label>
                <select id="customPath">
                    ${pathsOptions}
                </select>
            </div>
            <button id="uploadBtn">上传</button>
            <div class="preview" id="preview"></div>
            <script>
                document.getElementById('uploadBtn').addEventListener('click', async () => {
                    const fileInput = document.getElementById('fileInput');
                    const customPath = document.getElementById('customPath').value.trim();
                    const files = fileInput.files;

                    if (files.length === 0) {
                        alert("请选择至少一个图片");
                        return;
                    }

                    const preview = document.getElementById('preview');
                    preview.innerHTML = '';

                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('customPath', customPath);

                        try {
                            const response = await fetch(window.location.href, {
                                method: 'POST',
                                body: formData
                            });

                            if (response.ok) {
                                const result = await response.json();
                                const imgUrl = result.url;
                                preview.innerHTML += \`<img src="\${imgUrl}" />\`;
                            } else {
                                const result = await response.json();
                                const errorlog = result.error;
                                const imgUrl = result.url;
                                if (response.status === 500) {
                                    preview.innerHTML += \`    <div style="text-align:center;">
                                                                    <img src="\${imgUrl}"/>
                                                                    <p>图片已上传</p>
                                                                </div></br>\`;
                                } else {
                                    preview.innerHTML += \`<h3>上传失败：\${errorlog}</h3>\`;
                                }
                            }
                        } catch (error) {
                            preview.innerHTML += \`<h3>上传错误：\${error}</h3>\`;
                        }
                    }
                });
            </script>
        </body>
        </html>`;

        return new Response(htmlPage, {
            headers: { 'Content-Type': 'text/html' }
        });
    }else if (request.method === 'POST') { 
        const formData = await request.formData();
        const file = formData.get('file');
        const customPath = formData.get('customPath');
        const filename = file.name;
    
        const fileArrayBuffer = await file.arrayBuffer();
    
        const githubFilePath = `${customPath}/${filename}`;
    
        try {
            const githubUrl = await uploadToGithub(fileArrayBuffer, filename, githubFilePath);
    
            const finalUrl = DEFAULT_CUSTOM_LINK ? `${DEFAULT_CUSTOM_LINK}/${githubFilePath}` : githubUrl;
    
            return new Response(JSON.stringify({ url: finalUrl, }), {
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            const errorResponse = {
                error: error.message,
                url: DEFAULT_CUSTOM_LINK ? `${DEFAULT_CUSTOM_LINK}/${githubFilePath}` : '',
            };
    
            return new Response(JSON.stringify(errorResponse), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } else {
        return new Response('仅支持 GET 和 POST 请求', { status: 405 });
    }    
}

// =============================
// Cloudflare Worker 事件监听
// =============================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});
