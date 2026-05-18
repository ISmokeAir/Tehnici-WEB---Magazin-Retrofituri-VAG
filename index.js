const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

console.log('__dirname  :', __dirname);
console.log('__filename :', __filename);
console.log('process.cwd():', process.cwd());
/*
 * __dirname este intotdeauna folderul fisierului curent (index.js),
 * indiferent de unde este rulat procesul. process.cwd() este directorul
 * din care a fost pornita comanda "node" — pot fi diferite daca rulezi
 * procesul dintr-un alt director decat radacina proiectului.
 */

var obGlobal = {
    obErori: null
};

const vect_foldere = ['temp', 'logs', 'backup', 'fisiere_uploadate'];
for (const folder of vect_foldere) {
    const cale = path.join(__dirname, folder);
    if (!fs.existsSync(cale)) {
        fs.mkdirSync(cale);
        console.log(`Folder creat: ${folder}`);
    }
}

function initErori() {
    const caleJson = path.join(__dirname, 'erori.json');
    const dateJson = JSON.parse(fs.readFileSync(caleJson, 'utf-8'));

    dateJson.eroare_default.imagine = dateJson.cale_baza + '/' + dateJson.eroare_default.imagine;

    for (const eroare of dateJson.info_erori) {
        eroare.imagine = dateJson.cale_baza + '/' + eroare.imagine;
    }

    obGlobal.obErori = dateJson;
}

initErori();

function afisareEroare(res, identificator, titlu, text, imagine) {
    let obEroare = null;

    if (identificator !== undefined && identificator !== null) {
        obEroare = obGlobal.obErori.info_erori.find(e => e.identificator === identificator);
    }

    const sursa = obEroare || obGlobal.obErori.eroare_default;

    const titluFinal  = titlu   || sursa.titlu;
    const textFinal   = text    || sursa.text;
    const imagineFinal = imagine || sursa.imagine;

    if (obEroare && obEroare.status) {
        res.status(identificator);
    }

    res.render('pagini/eroare', {
        titlu:   titluFinal,
        text:    textFinal,
        imagine: imagineFinal
    });
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    res.locals.ip = req.ip;
    next();
});

app.get('*.ejs', (req, res) => {
    afisareEroare(res, 400);
});

app.use('/resurse', (req, res, next) => {
    const urlPath = req.path;
    if (urlPath.endsWith('/') || !path.extname(urlPath)) {
        afisareEroare(res, 403);
        return;
    }
    next();
});

app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'resurse', 'ico', 'favicon.ico'));
});

app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index');
});

// trebuie sa fie ultima
app.get('/*', (req, res) => {
    const pagina = req.params[0];
    res.render(`pagini/${pagina}`, {}, function(eroare, rezultatRandare) {
        if (eroare) {
            if (eroare.message.startsWith('Failed to lookup view')) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res, 500, null, eroare.message, null);
            }
        } else {
            res.send(rezultatRandare);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server pornit pe http://localhost:${PORT}`);
});
