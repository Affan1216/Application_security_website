const router = require('express').Router();
const {

    memberLogin, memberAuth, checkRole,sendOtp,
    memberSignup, loginOtp
} = require("../controller/authFunction")


const {
    validateSignup, validateLogin
} = require("../validation/validation");



router.post('/sendotp', sendOtp )


router.post("/register-admin", validateSignup, async (req, res) => {
    await memberSignup(req, "admin", res);
});

router.post("/register-seller", validateSignup, async (req, res) => {
    await memberSignup(req, "seller", res);
});

router.post("/register-customer", validateSignup, async (req, res) => {
    await memberSignup(req, "customer", res);
});

router.post("/register-manager", validateSignup, async (req, res) => {
    await memberSignup(req, "manager", res);
});

router.post("/loginOtp",loginOtp)

router.post("/login-admin", validateLogin, async (req, res) => {
    await memberLogin(req, "admin", res);
});

router.post("/login-seller", validateLogin, async (req, res) => {
    await memberLogin(req, "seller", res);
});

router.post("/login-customer", validateLogin, async (req, res) => {
    await memberLogin(req, "customer", res);
});


router.post("/login-manager", validateLogin, async (req, res) => {
    await memberLogin(req, "manager", res);
});


router.get("/public", (req, res) => {
    return res.status(200).json("Public Domain");
});

router.get(
    "/admin-protected",
    memberAuth,
    checkRole(["admin"]),
    async (req, res) => {
        return res.json(`Welcome ${req.name}`);
    }
);

router.get(
    "/manager-protected",
    memberAuth,
    checkRole(["manager"]),
    async (req, res) => {
        return res.json(`Welcome ${req.name}`);
    }
);

router.get(
    "/customer-protected",
    memberAuth,
    checkRole(["customer"]),
    async (req, res) => {
        return res.json(`Welcome ${req.name}`);
    }
)

router.get(
    "/seller-protected",
    memberAuth,
    checkRole(["seller"]),
    async (req, res) => {
        return res.json(`Welcome${req.name}`)
    }
)

module.exports = router;
