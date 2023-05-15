'use strict';

const http = require('http');

const dbConnect = require('./db');

global.uniCloud = require('./uniCloud-original');

function handleRequestBody(req, callback) {
  let body = '';
  if (req.method === 'POST') {
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const data = body ? JSON.parse(body) : {};
      callback(data);
    });
  } else {
    callback(null);
  }
}

(async () => {
  global.db = await dbConnect();
  const { Router } = require('./common/uni-cloud-router')
  const router = new Router(require('./config.js'))
  // 将处理请求体数据的代码放在一个函数中
  function requestListener(req, res) {
    // 在函数handleRequestBody中处理请求体数据
    handleRequestBody(req, (data) => {
      // 设置响应头部信息，允许跨域访问
      res.setHeader("Access-Control-Allow-Origin", "*");
      router.serve({
        path: req.url,
        httpMethod: req.method,
        headers: {},
        data, // 直接传递解析出的JSON对象 
      }).then(result => { 
        res.setHeader("Content-Type", "application/json")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type") 
        res.end(result.body)
      })
    })
  }

  // 创建 HTTP 服务器
  const server = http.createServer(requestListener);
  server.listen(3000, () => console.log('Server started on port 3000'))

})()