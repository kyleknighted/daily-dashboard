
/**
 * Module dependencies.
 */

var fs = require('fs')
var http = require('http')
var express = require('express');
var app = module.exports = express.createServer();
var io = require('socket.io');
var request = require('request');
var url = require('url');

var RedisStore = require('connect-redis')(express);
var session_store = new RedisStore;
var uuid = require('node-uuid');
var colors = require('colors');

var io = io.listen(app);
var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "bot@theablefew.com",
        pass: "flapjack10"
    }
});

var asanaKey = 'APIKEY';
var asanaUserRequest = url.parse('https://'+asanaKey+':@app.asana.com/api/1.0/users/me')

// Configuration
io.set('log level', 0); // Turn off annoying poll notice

app.listen(3000);
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.session({ secret: "cwmn0r4ng30wl" }));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routing
app.get('/', getUserData, function(req, res, next){
  var asanaJson = JSON.parse(req.asana.body)
  res.render('index', {
    asana: JSON.stringify(asanaJson.data)
  });
});

app.post('/get_project', function(req, res, next){
  var asanaProjectRequest = url.parse('https://'+asanaKey+':@app.asana.com/api/1.0/tasks/'+req.task_id+'/projects');
  

  // request({url:asanaTaskRequest}).pipe(fs.createWriteStream('task-'+asanaKey+'.json'))
  // fs.createReadStream('task-'+asanaKey+'.json').pipe(res);

  // console.log(res);
  // request({url: asanaTaskRequest}, function(err, res, next) {
  //   taskReturn = JSON.parse(res.body);
  //   taskData = taskReturn.data;
  //   for(task in taskData) {
  //     var asanaProjectRequest = url.parse('https://'+asanaKey+':@app.asana.com/api/1.0/tasks/'+taskData[task].id+'/projects');
      
  //   }
  // });
  // console.log(request);
  // request({url:asanaTaskRequest}).pipe(fs.createWriteStream('asanaTaskRequest.json'))
});

// Connection Info
io.sockets.on('connection', function (socket) {
  socket.on('send_workspace', function (data) {
    var asanaTaskRequest = url.parse('https://'+asanaKey+':@app.asana.com/api/1.0/tasks?workspace='+data.workspace+'&assignee=me')

    request({url: asanaTaskRequest}, function(err, res) {
      taskReturn = JSON.parse(res.body);
      socket.emit('get_workspace_tasks', taskReturn.data)
    });
  });

  socket.on('send_task', function (data) {
    var asanaProjectRequest = url.parse('https://'+asanaKey+':@app.asana.com/api/1.0/tasks/'+data.taskId+'/projects');

    request({url: asanaProjectRequest}, function(err, res) {
      taskReturn = JSON.parse(res.body);
      // console.log(data);
      taskReturn.task = data;
      socket.emit('get_task_project', taskReturn)
    });
  });
});



function getUserData( req, res, next ) {
  request({url: asanaUserRequest}, function(err, res) {
    req.asana = res
    next();
  });
}

// function beforeGetProject( task ) {
//   // console.log(typeof taskData);
//   console.log(task);
// }