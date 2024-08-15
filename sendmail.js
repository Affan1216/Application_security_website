const nodemailer = require('nodemailer');

const mailSender = async (email, title, body) =>{
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        let info = await transporter.sendMail({
            from: 'mohamedilyasaffan@gmail.com',
            to: email,
            subject: title,
            html: body,
        })
        return info;
    } catch(error){
        console.log(error.message);
    }
};
module.exports = mailSender;