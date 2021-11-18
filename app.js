const express = require('express')
const exphbs = require('express-handlebars')
const mercadopago = require('mercadopago')
const dotenv = require('dotenv')

if (process.env.NODE_ENV !== 'development') {
  dotenv.config()
}

const BASE_URL = process.env.BASE_URL

mercadopago.configure({
  integrator_id: process.env.INTEGRATOR_ID,
  access_token: process.env.ACCESS_TOKEN,
})

const port = process.env.PORT || 3000

const app = express()

app.engine('handlebars', exphbs())
app.set('view engine', 'handlebars')

app.use(express.static('assets'))

app.use('/assets', express.static(__dirname + '/assets'))

app.get('/', function (_, res) {
  res.render('home')
})

app.get('/', function (_, res) {
  res.render('home')
})

app.get('/success', function (req, res) {
  res.render('success', req.body)
})

app.get('/failure', function (req, res) {
  res.render('failure', req.body)
})

app.get('/pending', function (req, res) {
  res.render('pending', req.body)
})

app.get('/', function (_, res) {
  res.render('home')
})

app.get('/detail', function (req, res) {
  const { title, price, unit, img } = req.query

  if (!title || !price || !unit || !img) {
    throw new Error('Missing parameters')
  }

  const preference = {
    items: [
      {
        id: '1234',
        title: title,
        currency_id: 'ARS',
        unit_price: parseFloat(price),
        quantity: parseFloat(unit),
        picture_url: `${BASE_URL}${img.slice(1, img.length)}`,
        description: 'Dispositivo móvil de Tienda e-commerce',
      },
    ],
    auto_return: 'approved',
    back_urls: {
      success: `${BASE_URL}/success`,
      failure: `${BASE_URL}/failure`,
      pending: `${BASE_URL}/pending`,
    },
    paymentMethods: {
      excluded_payment_methods: [
        {
          id: 'amex',
        },
      ],
      excluded_payment_types: [
        {
          id: 'atm',
        },
      ],
      installments: 6,
    },
    external_reference: process.env.EMAIL,
  }

  mercadopago.preferences
    .create(preference)
    .then(function (response) {
      console.log(response.body)
      const { id } = response.body

      res.render('detail', { ...req.query, id })
    })
    .catch(function (error) {
      console.log(error)
      res.status(500).send('There was an error with MercadoPago')
    })
})

app.listen(port)
