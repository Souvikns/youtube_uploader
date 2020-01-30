// importing modules 

const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const {
    google
} = require('googleapis')
const axios = require('axios')
const youtubeApi = require('youtube-api')
const fs = require('fs')
const Lien = require('lien')
const opn = require('opn')
const Logger = require('bug-killer')
const prettyBytes = require('pretty-bytes')
const readJson = require('r-json')
const multer = require('multer')

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'uploads' )
    } ,
    filename: function(req,file,cb){
        cb(null,file.fieldname+'-'+Date.now()+'.mp4')
    }
})


const upload = multer({storage: storage})
//============================================


//middlewares 

const app = express()

app.use(bodyParser.urlencoded({
    extended: true
}))
app.set('view engine', 'ejs')
app.set('views', 'views')

//============================================

//youtube-api 

const CREDENTIALS = readJson(`${__dirname}/oauth2.keys.json`)

let server = new Lien({
    host: "Localhost",
    port: 5000
})

//Authenticate 



//============================================


var isLoggedIn = false

app.get('/', (req, res) => {
    res.render('index', {
        isLogin: isLoggedIn
    })
})


app.post('/list', upload.single('image'),(req, res) => {
    console.log(req.file)
    const path = './uploads/'+req.file.filename
    //oaut 
    let oauth = youtubeApi.authenticate({
        type: "oauth",
        client_id: CREDENTIALS.web.client_id,
        client_secret: CREDENTIALS.web.client_secret,
        redirect_url: CREDENTIALS.web.redirect_uris[0]
    });

    opn(oauth.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/youtube.upload"]
    }))

    // Handle oauth2 callbacks 

    server.addPage("/oauth2callback", Lien => {
        Logger.log("Trying to get the token using the following code " + Lien.query.code)
        oauth.getToken(Lien.query.code, (err, tokens) => {
            if (err) {
                Lien.lien(err, 400)
                return Logger.log(err)
            }
            Logger.log("Got the tokens")
            oauth.setCredentials(tokens)

            Lien.end("The video is being upload. Check out the logs in the terminal ")

            var req = youtubeApi.videos.insert({
                resource: {
                    // Video title and description 
                    snippet: {
                        title: "Testing Youtube api",
                        description: "Test video upload"
                    },
                    status: {
                        // do not want to spam subcribers 
                        privacyStatus: "public"
                    }

                },
                part: "snippet,status",
                media: {
                    body: fs.createReadStream(path)
                }

            }, (err, data) => {
                console.log("Done")
                process.exit()
                return res.redirect('/')
            })
            setInterval(function () {
                Logger.log(`${prettyBytes(req.req.connection._bytesDispatched)} bytes uploaded.`);
            }, 250);
        })
    })

})



//============================================




//app 

app.listen(3000, () => {
    console.log("Server started at port 3000....")
})