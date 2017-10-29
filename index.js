var pm2 = require('pm2');
var _ = require('lodash');

var center = {
  app_list: [],
};

center.sendMsg = function sendMsg(pm_id, packet){
  console.log('sendMsg:' + packet + ' to ' + pm_id);
  pm2.sendDataToProcessId(pm_id, {
    type: 'process:msg',
    data: {
      packet: packet,
    },
    topic: 'my topic'
  }, function(err, res){
    if (err){
      return console.log(err);
    }
    return console.log(res);
  });
};

center.receiveMsg = (packet) =>{
  console.log('receiveMsg:' + packet);
};

center.build = () => {
  return new Promise((resolve, reject)=>{
  pm2.connect(true, (err) => {
    if (err) return reject(err);
    pm2.start({
      script: './hello.js',
      execMode: 'cluster',
      instances: 2
    }, (err, apps) => {
      if(err) return reject(err);
      center.app_list = apps;
      pm2.launchBus((err, bus) => {
        if(err) return reject(err);
        bus.on('process:msg', center.receiveMsg);  
        resolve();
      });
    });
  });
  });
};

center.build().then(() => {
(function callMsg(increm){
  _.delay(function(){
    increm += 1;
    var pm_id = center.app_list[0].pm2_env.pm_id
    center.sendMsg(pm_id, 'ddd:' + increm);
    callMsg(increm);
  }, 2000);
})(1);
}).catch((err) =>{
  console.log(err);
});

