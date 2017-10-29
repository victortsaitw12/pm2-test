
process.on('message', function(packet){
  console.log(packet);
  process.send({
      type: 'process:msg',
      data:{
          success: true
      }
  });    
});

setInterval(() =>{
    console.log('hello pm2');
}, 3000);