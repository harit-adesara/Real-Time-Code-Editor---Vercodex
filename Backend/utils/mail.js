import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (option) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Vercodex",
      link: "https://vercodex.com",
    },
  });
  const emailTextual = mailGenerator.generatePlaintext(option.mailgenContent);
  const emailHtml = mailGenerator.generate(option.mailgenContent);
  const transporter = nodemailer.createTransport({
    host: process.env.GMAIL_HOST,
    port: parseInt(process.env.GMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
    connectionTimeout: 10000, // 10 seconds to connect
    greetingTimeout: 10000, // 10 seconds for greeting
    socketTimeout: 15000,
  });
  const mail = {
    from: `"Vercodex" <${process.env.GMAIL_USER}>`,
    to: option.email,
    subject: option.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    console.log("📧 EMAIL DEBUG:");
    console.log("  HOST:", process.env.GMAIL_HOST);
    console.log("  PORT:", process.env.GMAIL_PORT);
    console.log("  USER:", process.env.GMAIL_USER);
    console.log("  PASS exists:", !!process.env.GMAIL_PASS);
    await transporter.sendMail(mail);
    console.log("✅ Email sent to", option.email);
  } catch (error) {
    console.error("❌ SMTP Error Code:", error.code);
    console.error("❌ SMTP Error Message:", error.message);
    console.error("❌ SMTP Response:", error.response);
    throw error;
  }
};

const registerEmail = (username, passwordSetUrl) => {
  return {
    body: {
      name: username,
      intro: "We got request from you to verify your account into vercodex",
      action: {
        instructions: "To verify your account click to below button",
        button: {
          color: "#2fe16a",
          text: "Verify account",
          link: passwordSetUrl,
        },
      },
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "We got a request to reset password of your current account!",
      action: {
        instructions: "To reset your password click on the following button",
        button: {
          color: "#d92727ff",
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? just reply to this email, we'd love to help",
    },
  };
};

export { forgotPasswordMailgenContent, sendEmail, registerEmail };
