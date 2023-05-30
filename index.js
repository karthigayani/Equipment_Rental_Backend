import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import mongodb from "mongodb";
import { MongoClient } from "mongodb";
const PORT = process.env.PORT;
const URL = process.env.DB;
const app = express();
// MidleWare
app.use(express.json());
app.use(cors({
  origin: "*"
}))


// Connecting MongoDB
const createConnection = async () => {
  const client = new MongoClient(URL);
  await client.connect();
  console.log("MongoDB connected");
  return client;
};
const client = await createConnection();

app.get("/", (req, res) => {
  res.json({ message: "welcome" });
});

// create
app.post("/Equipment", async (req, res) => {
  try {
    let response = await client
      .db("EqupDB")
      .collection("Equipment")
      .insertOne(req.body);
    let resUser = await client
      .db("EqupDB")
      .collection("Equipment")
      .find()
      .toArray();
    res.status(200).json(resUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
});

// get equipments
app.get("/Equipments", async (req, res) => {
  try {
    let resUser = await client
      .db("EqupDB")
      .collection("Equipment")
      .find()
      .toArray();
    res.json(resUser);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

// get particular Equipment
app.get("/Equipment/:id", async (req, res) => {
  try {
    let User = await client
      .db("EqupDB")
      .collection("Equipment")
      .findOne({ _id: mongodb.ObjectId(req.params.id) });
    res.json(User);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// update the Equipment
app.put("/Equipment/:id", async (req, res) => {
  try {
    let User = await client
      .db("EqupDB")
      .collection("Equipment")
      .findOneAndUpdate(
        { _id: mongodb.ObjectId(req.params.id) },
        { $set: req.body }
      );
    let resUser = await client
      .db("EqupDB")
      .collection("Equipment")
      .find()
      .toArray();
    res.json(resUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Delete
app.delete("/Equipment/:id", async (req, res) => {
  try {
    let User = await client
      .db("EqupDB")
      .collection("Equipment")
      .findOneAndDelete({ _id: mongodb.ObjectId(req.params.id) });
    let resUser = await client
      .db("EqupDB")
      .collection("Equipment")
      .find()
      .toArray();
    res.json(resUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

//create Order history
app.post("/order", async (req, res) => {
  try {
    let kar = req.body;
    let response = await client
      .db("EqupDB")
      .collection("Orders")
      .insertOne(req.body);
    const priceCalculator = (price, rent, period, quantity) => {
      if (period === "Days") {
        let x = parseInt(rent);
        let x1 = x * 24;
        let y = parseInt(price);
        let xy = x1 * y;
        let xy1 = parseInt(quantity) * xy;
        return xy1;
      } else if (period === "Months") {
        let x = parseInt(rent);
        let y = parseInt(price);
        let x1 = x * 24 * 30;
        let xy = x1 * y;
        let xy1 = parseInt(quantity) * xy;
        return xy1;
      } else if (period === "Years") {
        let x = parseInt(rent);
        let y = parseInt(price);
        let x1 = x * 24 * 30 * 12;
        let xy = x1 * y;
        let xy1 = parseInt(quantity) * xy;
        return xy1;
      }
    };
    let price = priceCalculator(
      kar.Price,
      kar.Rental,
      kar.Period,
      kar.Quantity
    );

    let User = await client
      .db("EqupDB")
      .collection("Orders")
      .findOneAndUpdate({ _id: kar._id }, { $set: { TotalPrice: price } });
    let resUser = await client
      .db("EqupDB")
      .collection("Orders")
      .find()
      .toArray();
    res.json(resUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
});

// Delete Order
app.delete("/temp", async (req, res) => {
  try {
    let User = await client.db("EqupDB").collection("Orders").deleteMany({});
    res.status(200).json(User);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// get Order history
app.get("/orders", async (req, res) => {
  try {
    let resUser = await client
      .db("EqupDB")
      .collection("final")
      .find()
      .toArray();
    res.json(resUser);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

// register
app.post("/register", async (req, res) => {
  try {
    let user = client.db("EqupDB").collection("user");
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(req.body.password, salt);
    req.body.password = hash;
    let final = await user.insertOne(req.body);
    res.json({ message: "User successfully registered" });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

// login
app.post("/login", async (req, res) => {
  try {
    // getting the data from the db for the sent email
    let user = await client
      .db("EqupDB")
      .collection("user")
      .findOne({ email: req.body.email });
    console.log(user);
    // Login logic
    if (user) {
      let compare = await bcrypt.compare(req.body.password, user.password);
      if (compare) {
        if (user.AdminKey === req.body.AdminKey) {
          let token = jwt.sign({ _id: user._id }, process.env.SECRET, {
            expiresIn: "30m",
          });
          let userValues = {
            name: user.Name,
            token: token,
          };
          res.json({ userValues });
        } else {
          res.status(401).json({ message: "Admin not found" });
        }
      } else {
        res.json({ message: "password is wrong" });
      }
    } else {
      res.status(401).json({ message: "user email not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/final", async (req, res) => {
  try {
    let response = await client
      .db("EqupDB")
      .collection("final")
      .insertOne(req.body);
    res.status(200).send();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
});

// get orders
app.get("/finals", async (req, res) => {
  try {
    let resUser = await client
      .db("EqupDB")
      .collection("final")
      .find()
      .toArray();
    res.json(resUser);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`server listening on Port ${PORT}`);
});