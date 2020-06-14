
var http = require('http')
var fs = require('fs')
var url = require('url')
const { Console } = require('console')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /****66****/

  console.log('有人发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
  const session = JSON.parse(fs.readFileSync('./session.json').toString())
  const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
  if (path === "/log_in" && method === "POST") {
    response.setHeader('Content-Type', 'text/html; charset = utf - 8')
    const array = []
    request.on('data', (chunk) => { //监听上传数据事件
      array.push(chunk)
    })
    request.on('end', () => {
      const string = Buffer.concat(array).toString()
      const obj = JSON.parse(string)
      const user = userArray.find((user) => user.name === obj.name && user.password === obj.password)
      if (user === undefined) {
        response.statusCode = 400
        response.setHeader('Content-Type', 'json/html; charset = utf - 8')
        response.end(`{"errorCode":4005}`)
      } else {
        response.statusCode = 200
        const random = Math.random()
        session[random] = { user_id: user.id }
        fs.writeFileSync("./session.json", JSON.stringify(session))
        response.setHeader("Set-Cookie", `session_id=${random};HttpOnly`) //登录成功设置cookie
        response.end()
      }
    })

  } else if (path === "/home.html") {
    const cookie = request.headers['cookie']//读取cookie值
    const homeHtml = fs.readFileSync('./public/home.html').toString()
    let sessionId;
    try {
      sessionId = cookie
        .split(";")
        .filter(s => s.indexOf("session_id=") >= 0)[0]
        .split("=")[1];
    } catch (error) { }
    if (sessionId && session[sessionId]) {
      const userId = session[sessionId].user_id
      const user = userArray.find((user) => user.id === userId)
      // console.log(cookie, userId, sessionId, user,user.id)
      const content = homeHtml.replace('{{loginStatus}}', '已登录').replace('{{userName}}', user.name)
      response.write(content)
    } else {
      const content = homeHtml.replace('{{loginStatus}}', '未登录').replace('{{userName}}', '')
      response.write(content)
    }
    response.end()

  } else if (path === "/register" && method === "POST") {
    response.setHeader('Content-Type', 'text/html; charset = utf - 8')
    const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
    const array = []
    request.on('data', (chunk) => { //监听上传数据事件
      array.push(chunk)
    })
    request.on('end', () => {
      const string = Buffer.concat(array).toString()
      const obj = JSON.parse(string)
      const lastUser = userArray[userArray.length - 1]
      const newUser = {
        id: lastUser ? lastUser.id + 1 : 1,
        name: obj.name,
        password: obj.password
      }
      userArray.push(newUser)
      fs.writeFileSync('./db/users.json', JSON.stringify(userArray))
      response.end()
    })

  } else {
    response.statusCode = 200
    const index = path.lastIndexOf('.')
    const suffix = path.substring(index) //后缀
    const fileTypes = {   //可把后缀类型存入哈希表
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.png': 'image/png',
      '.json': 'text/json'
    }
    response.setHeader('Content-Type', `${fileTypes[suffix] || 'text/html'};charset=utf-8`)
    if (path === '/') { path = '/index.html' }
    let content
    try {
      content = fs.readFileSync(`./public${path}`)
    } catch (error) {
      content = '输入的路径不存在内容'
      response.statusCode = 404
    }
    response.write(content)
    response.end()

  }


})

/****88****/

server.listen(port)
console.log('监听 ' + port + ' 成功\n请打开 http://localhost:' + port)