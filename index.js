var pm2 = require('pm2');
var _ = require('lodash');

var app_list = [];

function sendMsg(increm){
  console.log('sendMsg:' + increm + ' to ' + app_list[0].pm2_env.pm_id);
  pm2.sendDataToProcessId(app_list[0].pm2_env.pm_id, {
    type: 'process:msg',
    data: {
      some: 'data',
      hello: true,
      incrm: increm
    },
    topic: 'my topic'
  }, function(err, res){
    if (err){
      return console.log(err);
    }
    return console.log(res);
  })
};

pm2.launchBus(function(err, bus){
  bus.on('process:msg', function(packet){
    console.log(JSON.stringify(packet));
  })    
});

pm2.connect(true, function(err){
    if (err){
        console.error(err);
        process.exit(2);
    }
    pm2.start({
        script: './hello.js',
        execMode: 'cluster',
        instances: 2
    }, function(err, apps){
        if(err){
            console.log(err);
            throw err;
        } 
        pm2.list((err, list) => {
            app_list = list;
           (function callMsg(increm){
             _.delay(function(){
             increm += 1;
              sendMsg(increm);
              callMsg(increm);
            }, 2000);
           })(1);
        });
    });

})