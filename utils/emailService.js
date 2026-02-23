const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendOTP = async (email, otp) => {
    const mailOptions = {
        from: `"Farmers Market" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP for Farmers Market",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2e7d32; text-align: center;">Farmers Market Verification</h2>
        <p>Hello,</p>
        <p>Thank you for joining the Farmers Market community! To complete your registration, please use the following One-Time Password (OTP):</p>
        <div style="background-color: #f1f8e9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #2e7d32; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code is valid for **10 minutes**. Please do not share this code with anyone.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #757575; text-align: center;">
          &copy; ${new Date().getFullYear()} Farmers Market Platform. Supporting our local farmers.
        </p>
      </div>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent: " + info.response);
        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw error;
    }
};
