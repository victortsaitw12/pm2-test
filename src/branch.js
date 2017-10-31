var _ = require('lodash');
var Leaf = require('./leaf.js');

var Branch = {
  onTRUNK_REQ_RELOAD: (proto) => {
    console.log('onTRUNK_REQ_RELOAD');
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  },
  onData: (protocol, recipient) => {
    var fn = _.noop();
    if (_.eq('branch', recipient)){
      fn = _.get(Branch, 'on' + protocol.proto);
    }
    if (_.eq('leaf', recipient)){
      fn = _.get(Leaf, 'on' + protcol.proto);
    }
    if (fn) return fn(packet);
    return console.log('branch does not understand ' + protocol.proto);
  },
  sendMsg: (packet) =>{
    process.send({
     type: 'process:msg',
     data: packet
    });
  },
  sprout: () => {
    return Leaf.sprout().then((state) => {
      return Branch.sendMsg({
       proto: 'BRANGE_NTF_READY',
       state: 'leaf grow',
      });
    }).catch((err) => {
      return Branch.sendMsg({
        proto: 'BRANGE_NTF_READY',
        state: 'leaf wither',
      });        
    });
  },
};

process.on('message', function(packet){
  console.log(JSON.stringify(packet));
  var protocol = JSON.parse(packet.data);
  Branch.onData(protocol, packet.recipient)   
});

Branch.sprout();


