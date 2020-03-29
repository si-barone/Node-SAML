require('dotenv').config();
const path = require('path');
const fs = require('fs');
const config = require('config');
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SAMLStrategy = require('passport-saml').Strategy;

const https = require('https');
const bodyParser = require('body-parser');

const app = express();

const privateKey = fs.readFileSync('security/private.key', 'utf8');
const certificate = fs.readFileSync('security/public.crt', 'utf8');
const idpCert = fs.readFileSync('security/idp.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.MYSECRET,
    resave: false,
    saveUninitialized: false
    })); // You will need to export this ENV VARIABLE before running

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
})

passport.deserializeUser((user, done) => {
    done(null, user);
});

const samlStrategy = new SAMLStrategy({
    entryPoint: config.get('SAML_ENTRYPOINT'),
    issuer: config.get('SAML_ISSUER'),
    protocol: config.get('SAML_PROTOCOL'),
    host: config.get('SAML_HOST'),
    logoutUrl: config.get('SAML_LOGOUTURL'),
    signatureAlgorithm: config.get('SAML_SIGNATURE_ALGORITHM'),
    privateCert: privateKey,
    cert: idpCert,

}, (profile, done) => {
    userProfile = profile;
    done(null, userProfile);
    }
);

passport.use(samlStrategy);

const redirectToLogin = (req, res, next) => {
    if (!req.isAuthenticated() || userProfile == null)
        return res.redirect('/app/login');
    
    next();
}

app.get('/app', redirectToLogin, (req, res) => {
    res.render('index', {
        title: 'Sample SAML Application',
        heading: 'Logged-In to SAML Web Application as ',
        user: req.query.user
    });
});

app.get('/app/login', passport.authenticate('saml', {
    successRedirect: '/app',
    failureRedirect: '/app/login'
    })
);

app.get('/app/logout', (req, res) => {
    if (req.user == null)
        return res.redirect('/app/home');

    return samlStrategy.logout(req, (err, uri) => {
        req.logout();

        userProfile = null;
        return res.redirect(uri);
    });
});

app.post('/app/logout', (req, res) => {
    return res.redirect('/app/home');
})

app.get('/app/failed', (req, res) => {
    res.status(401).send('Login failed');
});

app.post('/saml/consume', passport.authenticate('saml', {
    failureRedirect: '/app/failed',
    failureFlash: true
}), (req, res) => {
    // SAML assertion extraction from saml response
    const samlResponse = res.req.body.SAMLResponse;
    const decodedBuffer = Buffer.from(samlResponse, 'base64');
    const decoded = decodedBuffer.toString('utf8');
    const asserationXML = 
        ('<saml:Assertion' + decoded.split('<saml:Assertion')[1]).split(
                '</saml:Assertion>'
        )[0] + '</saml:Assertion>';
    const deNamespacedXML = asserationXML.replace(/<saml:/g, '<').replace(/<\/saml:/g, '</');
    const doc = new Dom().parseFromString(deNamespacedXML);
    const user = xpath.select('.//Subject/NameID/text()', doc);

    return res.redirect(`/app?user=${user}`);
});

app.get('/app/home', (req, res) => {
    res.render('home', {
        title: 'SAML Web Application',
        heading: 'SAML Web Application'
    });
});

app.get('/metadata', (req, res) => {
    const metadata = samlStrategy.generateServiceProviderMetadata(certificate, certificate);
    res.set('Content-Type', 'text/xml')
    res.send(metadata);
})

httpsServer.listen(8443, () => {
    console.log('SAML Test Application Started...');
});
