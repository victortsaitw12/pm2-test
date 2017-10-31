var dat = require('./src/trunk.js');

dat.start().then((res) => {
  dat.broadcast({
    proto: 'BLJ2DAT_REQ_COIN_ACTION',
    msg: 'test v2',
  });
}).catch((error) =>{
  console.log(error);
});

setTimeout(() => {
  dat.kill();
}, 10000);