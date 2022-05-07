const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const fs      = require('fs');
const path    = require('path');
const Pdf2Img = require('pdf2img-promises');


const app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json());

app.use(cors());

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('servert started at ' + port));

app.get('/', (req, res) => res.send('welcome'));


app.post('/convert', (req, res)=>{
  console.log(req.body);
  var buf = Buffer.from(req.body.file, 'base64');
  // Your code to handle buffer
  fs.writeFile('result_buffer.pdf', buf, error => {
      if (error) {
          throw error;
      } else {
          console.log('buffer saved!');
      }
  });
    res.json({status: true});
  });


app.post('/pdf-png', async (req, res) =>{
  var fileName = Date.now();
  try {
    var buf = Buffer.from(req.body.file, 'base64');  
       let converter = new Pdf2Img();
    var result = await converter.convertPdf2Img(buf, `output/${fileName}.png`, 1);
    var str = '';
    if(result != null){
      str = base64_encode(`output/${fileName}.png`);      
    }
    return res.status(200).json(str);

  } catch (error) {
    return res.status(404).json(error);
  }
});

function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString('base64');
}
async function convert2png(fileName){
  let input   = __dirname + `output/${fileName}.pdf`;
    let converter = new Pdf2Img();
    converter.on(fileName, (msg) => console.log('Received: ', msg));
    converter.setOptions({
      type: 'png',                                // png or jpg, default jpg
      size: 1024,                                 // default 1024
      density: 600,                               // default 600
      quality: 100,                               // default 100
      outputdir: __dirname + path.sep + 'output', // output folder, default null (if null given, then it will create folder name same as file name)
      outputname: fileName,                       // output file name, dafault null (if null given, then it will create image name same as input name)
      page: 0                                  // convert selected page, default null (if null given, then it will convert all pages)
    });
    return await converter.convert(input);    
}


