const _ = require('lodash');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://???:???@???.mlab.com:???/???';
let mongo = _.noop();
let MongoDB = {
  connect: () => {
    // Use connect method to connect to the server
    return MongoClient.connect(url).then((db) => {
      mongo = db
      return mongo;
    });
  },
  insert: (collection, docs) => {
    return mongo.collection(collection).insertMany(docs);
  },
  find: (collection, query) => {
    return mongo.collection(collection).find(query);
  },
  update: (collection, query, doc) => {
    return mongo.collection(collection).updateOne(query, doc);
  },
  remove: (collection, query) => {
    return mongo.collection(collection).deleteOne(query);
  },
  close: () => {
    return mongo.close();
  }
};

module.exports = MongoDB;
//MongoDB.connect().then(() => {
//    console.log('success')
//MongoDB.close();
//}).catch((err)=>{console.log(err);})
