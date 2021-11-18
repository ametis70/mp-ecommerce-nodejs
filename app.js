const express = require('express')
const exphbs = require('express-handlebars')
const mercadopago = require('mercadopago')
const dotenv = require('dotenv')
const path = require('path')

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

app.use(express.json())

app.engine(
  'handlebars',
  exphbs({
    extname: 'handlebars',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
  })
)

app.set('view engine', 'handlebars')

app.use(express.static('assets'))

app.use('/assets', express.static(__dirname + '/assets'))

app.get('/', function (_, res) {
  res.render('home')
})

app.get('/success', function (req, res) {
  res.render('success', req.query)
})

app.get('/failure', function (req, res) {
  res.render('failure', req.query)
})

app.get('/pending', function (req, res) {
  res.render('pending', req.query)
})

app.post('/notify', function (req, res) {
  console.log(req.body)
  res.status(200).send('OK')
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
    payer: {
      name: 'Lalo Landa',
      email: process.env.PAYER_EMAIL,
      phone: {
        area_code: '11',
        number: 22223333,
      },
      address: {
        street_name: 'Falsa',
        street_number: 123,
        zip_code: '111',
      },
    },
    payment_methods: {
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
    notification_url: `${BASE_URL}/notify`,
    external_reference: process.env.EMAIL,
  }

  mercadopago.preferences
    .create(preference)
    .then(function (response) {
      const { init_point } = response.body

      res.render('detail', { ...req.query, init_point })
    })
    .catch(function (error) {
      console.log(error)
      res.status(500).send('There was an error with MercadoPago')
    })
})

app.listen(port)
