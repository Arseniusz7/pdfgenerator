const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs')
const util = require('util')
const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const connection = require('./connection')
const PDFDocument = require('pdfkit')
const toArray = require('stream-to-array')

app.get('/user/:name', (req, res) => {
    let doc = new PDFDocument()
    let firstName = req.params.name
    connection.query('SELECT * FROM user WHERE firstName = ?', firstName, (error, results) => {
        if (error)
            res.json(false)
        else {
            if(results.length === 0)
                return res.json(false)
            doc.text(`${results[0].firstName} ${results[0].lastName}`).image(results[0].image)
            toArray(doc)
                .then((parts) => {
                    const buffers = parts
                        .map(part => util.isBuffer(part) ? part : Buffer.from(part));
                    let pdf = Buffer.concat(buffers);
                    connection.query('UPDATE user SET pdf = ? WHERE firstName = ?', [pdf, firstName],
                        error => error ? res.json(false) : res.json(true)
                    );
                })
            doc.end()
        }
    });

})

app.use(function(req, res) {
  res.json('Not Found');
});


module.exports = app;
