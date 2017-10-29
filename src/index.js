var graphql = require('graphql');
var schema = require('./schema.js');
var resolver = require('./resolver.js')

var dat = {};
dat.find = function(query){
  graphql(schema, query, resolver, {
    mongo: mongo,
    rds: rds,
    els,
  }).then(function(result)){
    return result;  
  }).catch(function(error){
    throw error;
  });
};

module.exports = dat;