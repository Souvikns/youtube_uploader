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
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.mp4')
    }
})


const upload = multer({
    storage: storage
})
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




//============================================


var isLoggedIn = false
let oauth = youtubeApi.authenticate({
    type: "oauth",
    client_id: CREDENTIALS.web.client_id,
    client_secret: CREDENTIALS.web.client_secret,
    redirect_url: CREDENTIALS.web.redirect_uris[0]
});

app.post('/login', (req, res) => {
    opn(oauth.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/youtube.upload"]
    }))
})

app.get('/success', (req, res) => {
    res.render('success', {})

})

app.get('/', (req, res) => {
    res.render('index', {
        isLogin: isLoggedIn
    })

})
app.get('/oauth2callback', (req, res) => {
    oauth.getToken(req.query.code, (err, tokens) => {
        if (err) {
            return Logger.log(err)
        }
        Logger.log('Got the tokens')
        oauth.setCredentials(tokens)
        isLoggedIn = true
        res.redirect('/')

    })


})


app.post('/list', upload.single('image'), (req, res) => {
    console.log(req.file)
    const path = './uploads/' + req.file.filename
    const title = req.body.title
    const description = req.body.description
    const fileSize = req.file.size

    var req = youtubeApi.videos.insert({
        resource: {
            // Video title and description 
            snippet: {
                title: title,
                description: description
            },
            status: {
                privacyStatus: "public"
            }

        },
        part: "snippet,status",
        media: {
            body: fs.createReadStream(path)
        },
        onUploadProgress: evt => {
            const progress = (evt.bytesRead / fileSize) * 100
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, null);
            process.stdout.write(`${Math.round(progress)}% complete`);
        }

    }, (err, data) => {
        console.log("Done")
        res.send("Done")
        
    })
})



//============================================


//app 

app.listen(5000, () => {
    console.log("Server started at port 3000....")
})