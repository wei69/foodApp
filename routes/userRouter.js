const router = require("express").Router();

const {
  accountSignup,
  accountLogin,
  accountAuth,
  checkRole,
} = require("../Controller/authFunctions");




router.post("/register-customer", (req, res) => {
  accountSignup(req.body, "customer", res);
});
router.post("/register-delivery_Driver", async (req, res) => {
  await accountSignup(req.body, "delivery_Driver", res);
});

router.post("/register-restaurant_Owner", async (req, res) => {
  await accountSignup(req.body, "restaurant_Owner", res);
});

router.post("/register-admin", async (req, res) => {
  await accountSignup(req.body, "admin", res);
});

router.post("/login-customer", async (req, res) => {
  await accountLogin(req.body, "customer", res);
});

router.post("/login-delivery_Driver", async (req, res) => {
  await accountLogin(req.body, "delivery_Driver", res);
});

router.post("/login-restaurant_Owner", async (req, res) => {
  await accountLogin(req.body, "restaurant_Owner", res);
});

router.post("/login-admin", async (req, res) => {
  await accountLogin(req.body, "admin", res);
});

router.get("/public", (req, res) => {
  return res.status(200).json("this is a public Domain");
});





router.get(
  "/customer-protected",
  accountAuth,
  checkRole(["customer"]),
  async (req, res) => {
    return res.json(`welcome ${req.name}`);
  }
);
router.get(
  "/delivery_Driver-protected",
  accountAuth,
  checkRole(["delivery_Driver"]),
  async (req, res) => {
    return res.json(`welcome ${req.name}`);
  }
);
router.get(
  "/restaurant_Owner-protected",
  accountAuth,
  checkRole(["restaurant_Owner"]),
  async (req, res) => {
    return res.json(`welcome ${req.name}`);
  }
);

router.get(
  "/admin-protected",
  accountAuth,
  checkRole(["admin"]),
  async (req, res) => {
    return res.json(`welcome ${req.name}`);
  }
);

module.exports = router;
