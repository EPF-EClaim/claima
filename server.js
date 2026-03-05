const express = require('express');

const app = express();



app.get('/runjob', function(req, res){

   console.log('==> [APP JOB LOG] Job is running . . .');

   res.send('Finished job');

});



const port = process.env.PORT || 3000;

app.listen(port, function(){

   console.log('listening');

})