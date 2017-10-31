var Mongo = require('./Mongo.js');

var Leaf = {
};

Leaf.sprout = () => {
  return Mongo.connect().then((res) => {
    console.log('mongo ' + res);
    return 'grow'
  }).catch((err) => {
    console.log(err);
    throw err;
  });
};

Leaf.onBLJ2DAT_REQ_COIN_ACTION = (data) => {
  return console.log('Leaf:' + data);
};

module.exports = Leaf;