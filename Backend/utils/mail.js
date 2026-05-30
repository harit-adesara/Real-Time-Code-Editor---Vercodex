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
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
  const mail = {
    from: `"Vercodex" <${process.env.GMAIL_USER}>`,
    to: option.email,
    subject: option.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
    console.log("✅ Email sent successfully to", option.email);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message); // ✅ clear error
    throw error; // ✅ don't silently fail — let caller know
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
