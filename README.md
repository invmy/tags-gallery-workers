# tags-gallery-workers
这是一个简单且快速

包含Pages页面、Workers快速上传页面。

一个标签照片墙

部署仅仅部署包含图片链接的html网页，部署超快。

使用流程：
1. 生成标签会以字符串`-`进行分割
2. workers会自动获取最新的文件夹。上传图片到GitHub仓库。
3. github仓库自动运行action 发布到Pages。


# 如何部署gallery
1. 右上角`Use this template`使用此模板创建自己的仓库
2. 仓库`Settings`打开来自Action部署的`Pages`
3. 尝试部署，部署成功部署示例页面
4. 
## 部署到Cloudflare Pages
直接链接部署。
```
构建命令: node gallery-generate.js
构建输出: output/

添加一个变量填写你的用户名/仓库

GITHUB_REPOSITORY : user/repo
```

# 如何部署上传端workers？
这需要PAT也就是`个人授权密钥` 创建自己的密码。过期时间任意，仓库建议只授权这一个仓库。权限只需要Content内容:写入
1. 前往https://github.com/settings/personal-access-tokens
2. 修改workers.js, 前往Cloudflare 部署一个`workers`。


# 如何创建新的文件夹
创建一个目录，封面命名为`cover`需要保留后缀。带文件夹一起上传到`images`目录下

# 如何插入到其他网站
网站可能需要使用`Raw html`才能使用iframe容器
```
<!-- iframe 容器 -->
<div class="iframe-container">
    <iframe src="https://github.io/index.html" width="100%" height="1000px"></iframe>
</div>
```

# 修改CDN
默认使用jsdelivr作为cdn
需要修改或者删除。请修改cdn变量
