const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const { Member, Otp } = require("../database/member");
const otpGenerator = require('otp-generator');


const Max_attempt = 3;
const lock_time = 10 * 60 * 1000;

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const checkUserPresent = await Member.findOne({ email });
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: 'User is already registered'
            });
        }

        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        let result = await Otp.findOne({ otp: otp });
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await Otp.findOne({ otp: otp });
        }

        const otpPayload = { email, otp };
        await Otp.create(otpPayload);
        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            otp,
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const memberSignup = async (req, role, res) => {
    try {
        const { name, email, password, otp } = req.body;

        let nameNotTaken = await validateMemberName(name);
        if (!nameNotTaken) {
            return res.status(400).json({
                success: false,
                message: 'Member name is already taken'
            });
        }

        let emailNotRegistered = await validateMemberEmail(email);
        if (!emailNotRegistered) {
            return res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        const otpData = await Otp.findOne({ email }).sort({ createdAt: -1 }).limit(1);
        if (!otpData) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found for this email',
            });
        }

        if (otp !== otpData.otp) {
            return res.status(400).json({
                success: false,
                message: 'The OTP is not valid',
            });
        }

        const hpassword = await bcrypt.hash(password, 12);
        const newMember = new Member({
            name,
            email,
            password: hpassword,
            role: role
        });

        await newMember.save();
        await Otp.deleteOne({ _id: otpData._id });
        return res.status(201).json({
            success: true,
            message: "Hurray! You are now successfully registered"
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: `$(error.message)`
        });
    }
};

const validateMemberName = async (name) => {
    let member = await Member.findOne({ name });
    return member ? false : true;
};

const validateMemberEmail = async (email) => {
    let member = await Member.findOne({ email });
    return member ? false : true;
};


const loginOtp = async (req, res) => {
    try {
        const { name } = req.body;
        const member = await Member.findOne({ name });
        if (!member) {
            return res.status(404).json({
                sucess: false,
                message: 'member not found. please register first'
            });
        }
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        let result = await Otp.findOne({ otp: otp })
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await Otp.findOne({ otp: otp })
        }

        const otpPayload = { email: member.email, otp }
        await Otp.create(otpPayload);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            otp,
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, error: error.message })
    }
};

const memberLogin = async (req, role, res) => {
    let { name, password, otp } = req.body;
    console.log(name, password);
    const member = await Member.findOne({ name });
    if (!member) {
        return res.status(404).json({
            message: "Member not found. Invalid login credentials"
        });
    }

    if (member.isLocked()) {
        return res.status(423).json({
            message: "Account is locked. Please try again later."
        });
    }

    if (member.role !== role) {
        return res.status(403).json({
            message: "Please make sure you are logging in from the right"
        });
    }

    let isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
        member.failedLoginAttempts += 1; 
        if (member.failedLoginAttempts >= Max_attempt) {
            member.lockUntil = Date.now() + lock_time;
        }
        await member.save();

        return res.status(403).json({
            message: "Incorrect username or password."
        });
    }

    if (!otp) {
        await loginOtp(req, res);
        return res.status(200).json({
            message: "Otp sent to your email. Please verify to complete login"
        });
    }

    const otpData = await Otp.findOne({ email: member.email }).sort({ createdAt: -1 }).limit(1);
    if (!otpData) {
        return res.status(400).json({
            success: false,
            message: 'OTP not found for this email',
        });
    }

    if (otp !== otpData.otp) {
        return res.status(400).json({
            success: false,
            message: 'The OTP is not valid',
        });
    }

    member.failedLoginAttempts = 0;
    member.lockUntil = undefined;
    let token = jwt.sign(
        {
            role: member.role,
            name: member.name,
            email: member.email
        },
        process.env.APP_SECRET,
        { expiresIn: "3d" }
    );
    let result = {
        name: member.name,
        role: member.role,
        email: member.email,
        token: token,
        expiresIn: 168
    };
    await Otp.deleteOne({ _id: otpData._id });
    return res.status(200).json({
        ...result,
        message: "You are now logged in."
    });
}

const memberAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({
        message: "Missing Token"
    });
    const token = authHeader.split(' ')[1];
    jwt.verify(
        token,
        process.env.APP_SECRET,
        (err, decoded) => {
            if (err) return res.status(403).json({
                message: "Wrong Token"
            });
            console.log(decoded.name);
            req.name = decoded.name;
            next();
        },
    );
};

const checkRole = roles => async (req, res, next) => {
    let { name } = req;
    const member = await Member.findOne({ name });
    !roles.includes(member.role)
        ? res.status(401).json("Sorry you do not have access to this route")
        : next();
};

module.exports = {
    memberSignup,
    memberLogin,
    checkRole,
    memberAuth,
    sendOtp,
    loginOtp
};