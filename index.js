var pm2 = require('pm2');
var _ = require('lodash');

var center = {
  app_list: [],
  reload_list: {}
};

center.sendMsg = (pm_id, packet) => {
  console.log('sendMsg:' + packet + ' to ' + pm_id);
  pm2.sendDataToProcessId(pm_id, {
    type: 'process:msg',
    data: JSON.stringify(packet),
    topic: 'my topic'
  }, (err, res) => {
    if (err){
      return console.log(err);
    }
    return console.log(res);
  });
};

center.receiveMsg = (packet) =>{
  console.log('receiveMsg:' + JSON.stringify(packet));
  var fn = _.get(center, 'on' + packet.data.proto);
  if (fn) {
    return fn(_.assign(packet.data, {
      pm_id: packet.process.pm_id, 
      name: packet.process.name,
    }))
  } else {
    console.log('fn is empty')
  }
};

center.online = (packet) => {
  return console.log('process online:' + packet.process.pm_id);
};

center.restart = (packet) => {
  return console.log('process restart:' + packet.process.pm_id);
};

center.allEvents = (e, packet) => {
  if (_.eq('online', packet.event)){
    return center.online(packet);
  }
  if(_.eq('exit', packet.event)){
    return console.log('process exit:' + packet.process.pm_id);
  }
  if(_.eq('restart', packet.event)){
    return center.restart(packet);
  }
  console.log(JSON.stringify(packet));
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
        bus.on('process:*', center.allEvents);
        resolve('success');
      });
    });
  });
  });
};

center.findReloadPM = _.cond([
  [(reload_list) => {
    return _.isEmpty(reload_list);
  }, _.constant(-1)],
  [(reload_list) => {
    return _.some(reload_list, (state) => {
      return _.eq('start', state);
    });
  },
  (reload_list) => {
    let reload_app = _.pickBy(reload_list, (state) => {
      return _.eq('start', state);
    });
    return _.parseInt(_.keys(reload_app).pop());
  }],
  [_.stubTrue, _.constant(-1)],  
]);

center.reload = _.flow([
  (reload_list) => {
    let reload_pm_id = center.findReloadPM(reload_list);
    if (_.eq(-1, reload_pm_id)){
      return reload_list;
    }
    _.set(reload_list, reload_pm_id, 'reloading');
    center.sendMsg(_.parseInt(reload_pm_id), {
      proto: 'CENTER_REQ_RELOAD'
    });
    return reload_list;
  },
]);

center.onBRANCH_NTF_READY = _.flow([
  (protocol) => {
    _.unset(center.reload_list, protocol.pm_id);
    return center.reload_list;
  },
  center.reload,
  (reload_list) => {
    center.reload_list = reload_list;
  },
]);

center.onDAT_NTF_RELOAD = _.flow([
  () => {
    return _.reduce(center.app_list, (res, app) => {
      return _.set(res, app.pm2_env.pm_id, 'start');
    }, {});
  },
  center.reload,
  (reload_list) => {
    center.reload_list = reload_list;
  },
]);
//(function callMsg(increm){
//  _.delay(function(){
//    increm += 1;
//    var pm_id = center.app_list[0].pm2_env.pm_id
//    center.sendMsg(pm_id, 'ipm2:' + increm);
//    callMsg(increm);
//  }, 2000);
//})(1);

//(function reload(increm){
//  _.delay(function(){
//    increm += 1;
//    var pm_id = center.app_list[0].pm2_env.pm_id;
//    pm2.restart(pm_id);
//  }, 2000);
//})(1);

center.build().then((res) => {
  return setTimeout(center.onDAT_NTF_RELOAD, 5000);
}).catch((error) =>{
  console.log(error);
});



