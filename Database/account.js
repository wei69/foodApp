const { Schema, model } = require("mongoose");   //no sql model //
const AccountSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "delivery_Driver", "restaurant_Owner", "admin"],
    },
    password: {
      type: String,
      required: true,
    },
  },

  { timestamps: true }
);
module.exports = model("account", AccountSchema);
