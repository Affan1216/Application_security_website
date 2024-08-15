const {Schema, model} = require("mongoose");
const mailSender = require("../sendmail")

const MemberSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        role:{
            type: String,
            enum: ["manager", "customer", "seller", "admin"]
        },
        password: {
            type: String,
            required: true
        },
        failedLoginAttempts: { 
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date
        }
    },
    {timestamps: true}
);

MemberSchema.methods.isLocked = function(){
    return !!(this.lockUntil && this.lockUntil> Date.now());
};



const otpSchema = new Schema({
    email:{
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60*5,
    },
});
async function sendVerificationEmail(email, otp){
    const mailResponse = await mailSender(
        email,
        "verification Email",
        `<h1>Please confirm your OTP</h1>
        <p>here is your OTP code: ${otp}</p>`
    );
    console.log("Email send successfully: ", mailResponse)
}
otpSchema.pre("save", async function(next){
    console.log("Doc saved to dtbase");
    if(this.isNew){
        await sendVerificationEmail(this.email, this.otp);
    }
    next();
})



const Member = model("Member", MemberSchema);
const Otp = model("Otp", otpSchema);
module.exports = { Member, Otp };