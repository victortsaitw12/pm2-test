var pm2 = require('pm2');
var _ = require('lodash');

var Trunk = {
  branch_list: [],
  revive_list: {},
};

Trunk.sendMsg = (pm_id, packet, recipient) => {
  console.log('sendMsg:' + packet + ' to ' + pm_id);
  pm2.sendDataToProcessId(pm_id, {
    type: 'process:msg',
    data: JSON.stringify(packet),
    recipient: recipient,
    topic: 'my topic'
  }, (err, res) => {
    if (err){
      return console.log(err);
    }
    return console.log(res);
  });
};

Trunk.broadcastLeaves = (packet) => {
  return _.forEach(Trunk.branch_list, (branch) =>
    Trunk.sendMsg(branch.pm2_env.pm_id, packet, 'leaf')
  );
};

Trunk.receiveMsg = (packet) => {
  console.log('receiveMsg:' + JSON.stringify(packet));
  var fn = _.get(Trunk, 'on' + packet.data.proto);
  if (fn) {
    return fn(_.assign(packet.data, {
      pm_id: packet.process.pm_id, 
      name: packet.process.name,
    }));
  }
  return console.log('fn is empty');
};

Trunk.allEvents = (event, packet) => {
  if (_.eq('online', packet.event)){
  return console.log('process online:' + packet.process.pm_id);
  }
  if(_.eq('exit', packet.event)){
    return console.log('process exit:' + packet.process.pm_id);
  }
  if(_.eq('restart', packet.event)){
    return console.log('process restart:' + packet.process.pm_id);
  }
  console.log(JSON.stringify(packet));
};

Trunk.grow = () => {
  return new Promise((resolve, reject)=>{
  pm2.connect(true, (err) => {
    if (err) return reject(err);
    pm2.start({
      script: './src/branch.js',
      execMode: 'cluster',
      instances: 2
    }, (err, apps) => {
      if(err) return reject(err);
      Trunk.branch_list = apps;
      pm2.launchBus((err, bus) => {
        if(err) return reject(err);
        bus.on('process:msg', Trunk.receiveMsg); 
        bus.on('process:*', Trunk.allEvents);
        resolve('success');
      });
    });
  });
  });
};

Trunk.findReviveBranch = _.cond([
  [(revive_list) => {
    return _.isEmpty(revive_list);
  }, _.constant(-1)],
  [(revive_list) => {
    return _.some(revive_list, (state) => {
      return _.eq('start', state);
    });
  },
  (revive_list) => {
    let revive_branch = _.pickBy(revive_list, (state) => {
      return _.eq('start', state);
    });
    return _.parseInt(_.keys(revive_branch).pop());
  }],
  [_.stubTrue, _.constant(-1)],  
]);

Trunk.revive = _.flow([
  (revive_list) => {
    let revive_pm_id = Trunk.findReviveBranch(revive_list);
    if (_.eq(-1, revive_pm_id)){
      return revive_list;
    }
    _.set(revive_list, revive_pm_id, 'reloading');
    Trunk.sendMsg(_.parseInt(revive_pm_id), {
      proto: 'TRUNK_REQ_RELOAD',
    }, 'branch');
    return revive_list;
  },
]);

Trunk.onBRANCH_NTF_READY = _.flow([
  (protocol) => {
    _.unset(Trunk.revive_list, protocol.pm_id);
    return Trunk.revive_list;
  },
  Trunk.revive,
  (revive_list) => {
    Trunk.revive_list = revive_list;
  },
]);

Trunk.reviveBranches = _.flow([
  () => {
    return _.reduce(Trunk.branch_list, (res, app) => {
      return _.set(res, app.pm2_env.pm_id, 'start');
    }, {});
  },
  Trunk.revive,
  (revive_list) => {
    Trunk.revive_list = revive_list;
  },
]);

Trunk.kill = () => {
  return _.forEach(Trunk.branch_list, (branch) => {
    pm2.delete(branch.pm2_env.pm_id, (err, proc) => {
      console.log('delete!!!');
      console.log(err);
      console.log(proc);
    });
  });
};

module.exports = {
  start: Trunk.grow,
  reload: Trunk.reviveBranches,
  broadcast: Trunk.broadcastLeaves,
  kill: Trunk.kill,
};





