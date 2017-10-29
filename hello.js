var _ = require('lodash');

var branch = {};

branch.onCENTER_REQ_RELOAD = (proto) => {
  console.log('onCENTER_REQ_RELOAD');
  setTimeout(() => {
    process.exit(1);
  }, 1000);
}

branch.onCENTER_REQ_STATE = (proto) => {
  console.log('onCENTER_REQ_STATE');
  setTimeout(() => {
    process.send({
      type: 'process:msg',
      data: {
        proto: 'BRANCH_RSP_STATE',
        state: 'READY',
      }
    });
  }, 1000);
};

process.on('message', function(packet){
  console.log(JSON.stringify(packet));
  var protocol = JSON.parse(packet.data);
  var fn = _.get(branch, 'on' + protocol.proto);
  console.log(fn);
  if (fn) return fn(packet);
  process.send({
    type: 'process:msg',
    data:{
      success: true
    }
  });    
});

setTimeout(() =>{
  process.send({
    type: 'process:msg',
    data: {
      proto: 'BRANCH_NTF_READY',
    }
  })
}, 1000)

