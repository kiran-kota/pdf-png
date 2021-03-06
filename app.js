const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;

const fs      = require('fs');
const path    = require('path');
const Pdf2Img = require('pdf2img-promises');
const axios = require('axios');


// cloudinary configuration
cloudinary.config({
  cloud_name: "vikramin-export",
  api_key: "579396547732622",
  api_secret: "WS_-RNNSzhE4AxqPrVO1cTTWHpM"
});


const app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json());

app.use(cors());

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('servert started at ' + port));

app.get('/', (req, res) => res.send('welcome'));

app.get('/download/:id', (req, res)=>{
  const path = `output/${req.params.id}`;
  res.download(path);
});



app.get('/upload/:id/:gid', async (req, res)=>{
  const path = `output/${req.params.id}.pdf`;
  await download(req.params.gid, req.params.id);
  res.json({status: true});
});

async function download(id, filename){
  const url = 'https://drive.google.com/uc?export=download&id=' + id;
  const path = `output/${filename}.pdf`;

  const response = await axios.get(url, {responseType: "stream"});
  response.data.pipe(fs.createWriteStream(path));  
  setTimeout(async () =>  await convert2png(filename), 10000);
}




async function downloadFile(id, filename) {  
  const url = 'https://drive.google.com/uc?export=download&id=' + id;
  const path = `output/${filename}.pdf`; //path.resolve(__dirname, 'output', id + '.pdf');
  const writer = fs.createWriteStream(path)

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  });
}

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
    var conresult = await converter.convertPdf2Img(buf, `output/${fileName}.png`, 1);
    var result = null;
    // if(result != null){
    //   str = base64_encode(`output/${fileName}.png`);      
    // }
    if(conresult != null){
      result = await cloudinary.uploader.upload(__dirname + `/output/${fileName}.png`);
      console.log(result, 'result');
    }

    return res.status(200).json(result);

  } catch (error) {
    return res.status(404).json(error);
  }
});

function base64_encode(file) {
  var bitmap = fs.readFileSync(file);
  return new Buffer(bitmap).toString('base64');
}

async function convert2png(fileName){
 try {
  let input   = __dirname + `/output/${fileName}.pdf`;
  console.log(input, 'input file');
    let converter = new Pdf2Img();
    converter.on(fileName, (msg) => console.log('Received: ', msg));
    converter.setOptions({
      type: 'png',                                // png or jpg, default jpg
      size: 1024,                                 // default 1024
      density: 600,                               // default 600
      quality: 100,                               // default 100
      outputdir: __dirname + path.sep + 'output', // output folder, default null (if null given, then it will create folder name same as file name)
      outputname: fileName,                       // output file name, dafault null (if null given, then it will create image name same as input name)
      page: 1                                  // convert selected page, default null (if null given, then it will convert all pages)
    });
    await converter.convert(input); 
    const result = await cloudinary.uploader.upload(__dirname + `/output/${fileName}_1.png`);
    console.log(result, 'result');
 } catch (error) {
   console.log(error);
 }  
}


