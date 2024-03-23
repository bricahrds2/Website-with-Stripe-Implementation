if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

console.log(stripeSecretKey)
console.log(stripePublicKey)

const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())

app.get('/shopping', function(req, res){
    fs.readFile('items.json', function(error, data){
        if(error){
            res.status(500).end()
        } else {
            res.render('shopping.ejs', {
                stripePublicKey: stripePublicKey,
                items: JSON.parse(data)
            })
        }
    })
})

// After payment button is clicked, send the datat to Stripe and returns the key.
app.post('/purchase', function(req, res){
    fs.readFile('items.json', function(error, data){
        if(error){
            res.status(500).end()
        } else {
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch, itemsJson.miscellaneous)
            let total = 0
            req.body.items.forEach( function(item){
                const itemJson = itemsArray.find(function(i) {
                    return i.id == item.id
                })
                total = total + itemJson.price * item.quantity
            })
            // send charges to stripe to charge card
            // Promise to handle what happens after the process is complete or if there is an error
            stripe.charges.create({
                amount: total,
                source: req.body.stripeTokenId,
                currency: 'usd'
            }).then(function() {
                console.log('Successful Charge')
                res.json({message: 'Successfully purchased items'})
            }).catch(function() {
                console.log('Charge Failed')
                res.status(500).end()
            })
        }
    })
})

app.listen(3000)