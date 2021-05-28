const express = require('express')
const mongoose = require('mongoose')
const crypto = require('crypto')
const port = process.env.PORT || 5000
require('dotenv').config()
require('./DB/connection')
let app = express()
app.use(express.json())
const { create } = require('xmlbuilder')

const schema = new mongoose.Schema({
    amount: Number,
    t_id:String,
	account_id:String,
	status:Boolean
});

app.post('/final_recipt', async(req, res) =>{
	try{

		const model = new mongoose.model("final_recipt", schema)
		const recipt = new model({
			amount : req.body.amount,
			t_id:req.body.t_id,
			account_id:req.body.account_id,
		})
		const createRecipt = await recipt.save()
		res.status(201).send(createRecipt)

	}catch(e){
		res.status(400).send("Something went wrong")
	}
})

app.delete('/delete_order/:id', async(req, res) =>{
	try{
		const _id = (req.params.id)
		const deleteData = await findData(_id).findOneAndDelete({_id: req.body._id}, (err)=>{
			if(err){
				res.status(400).send("Something went wrong.")
			}
			
			res.send("Deleted Successfully")
		})
	}catch(e){
		console.log(e)
		res.status(400).send(e)
	}
})

app.post('/verification', async(req, res) =>{
	try{
		const SECRET = 'a65e6cbffa15cd44f2a33fe2f6424929a448320b'  
		const shasum = crypto.createHmac('sha256', SECRET)
		shasum.update(JSON.stringify(req.body))
		const digest = shasum.digest('hex')

		if (digest === req.headers['x-razorpay-signature']) {
			const accountNumber = req.body.account_id
			const user = new findData(accountNumber)({
				amount:JSON.stringify(req.body.payload.payment.entity.amount/100, null, 4),
				t_id:JSON.stringify(req.body.payload.payment.entity.id, null, 4),
				account_id:JSON.stringify(req.body.account_id, null, 4),
				status:false
			})
			const createuser = await user.save()
			res.status(201).send(createuser)
		}
		console.log(req.body)
	}catch(e){res.status(400).send(e)}
})

app.get('/verify/:id', async(req, res)=>{
	try{

		const _id = (req.params.id)
		const accountData = await findData(_id).find().where('status').equals(false);
		const isEmpty = Object.keys(accountData).length === 0 
		if(isEmpty){
			return res.status(404).send("Invalid id...")
		}
		else{
			res.send(accountData)
		}
	}catch(e){
		console.log("error is here")
		res.status(400).send(e)
	}
})

function findData(id){
	const model = new mongoose.model(`${id}`, schema)
	return model
}

app.listen(port,  ()=>{
	console.log(`Connection is stablished at port ${port}`)
})