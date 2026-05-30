// import Mailgen from "mailgen";
// import nodemailer from "nodemailer";

// const sendEmail = async (option) => {
//   const mailGenerator = new Mailgen({
//     theme: "default",
//     product: {
//       name: "Vercodex",
//       link: "https://vercodex.com",
//     },
//   });
//   const emailTextual = mailGenerator.generatePlaintext(option.mailgenContent);
//   const emailHtml = mailGenerator.generate(option.mailgenContent);
//   const transporter = nodemailer.createTransport({
//     host: process.env.GMAIL_HOST,
//     port: parseInt(process.env.GMAIL_PORT),
//     auth: {
//       user: process.env.GMAIL_USER,
//       pass: process.env.GMAIL_PASS,
//     },
//     connectionTimeout: 10000,
//     greetingTimeout: 10000,
//     socketTimeout: 15000,
//   });
//   const mail = {
//     from: `"Vercodex" <${process.env.GMAIL_USER}>`,
//     to: option.email,
//     subject: option.subject,
//     text: emailTextual,
//     html: emailHtml,
//   };

//   try {
//     console.log("📧 EMAIL DEBUG:");
//     console.log("  HOST:", process.env.GMAIL_HOST);
//     console.log("  PORT:", process.env.GMAIL_PORT);
//     console.log("  USER:", process.env.GMAIL_USER);
//     console.log("  PASS exists:", !!process.env.GMAIL_PASS);
//     await transporter.sendMail(mail);
//     console.log("✅ Email sent to", option.email);
//   } catch (error) {
//     throw error;
//   }
// };

// const registerEmail = (username, passwordSetUrl) => {
//   return {
//     body: {
//       name: username,
//       intro: "We got request from you to verify your account into vercodex",
//       action: {
//         instructions: "To verify your account click to below button",
//         button: {
//           color: "#2fe16a",
//           text: "Verify account",
//           link: passwordSetUrl,
//         },
//       },
//     },
//   };
// };

// const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
//   return {
//     body: {
//       name: username,
//       intro: "We got a request to reset password of your current account!",
//       action: {
//         instructions: "To reset your password click on the following button",
//         button: {
//           color: "#d92727ff",
//           text: "Reset password",
//           link: passwordResetUrl,
//         },
//       },
//       outro:
//         "Need help, or have questions? just reply to this email, we'd love to help",
//     },
//   };
// };

// export { forgotPasswordMailgenContent, sendEmail, registerEmail };

import Mailgen from "mailgen";
import { google } from "googleapis";
import dotenv, { config } from "dotenv";
dotenv.config({
  path: "./.env",
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

console.log("CLIENT_ID:", !!process.env.GOOGLE_CLIENT_ID);
cd;
console.log("CLIENT_SECRET:", !!process.env.GOOGLE_CLIENT_SECRET);
console.log("REFRESH_TOKEN:", !!process.env.GOOGLE_REFRESH_TOKEN);
console.log("GMAIL_USER:", !!process.env.GMAIL_USER);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
});

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

  const message = [
    `From: Vercodex <${process.env.GMAIL_USER}>`,
    `To: ${option.email}`,
    `Subject: ${option.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=boundary123",
    "",
    "--boundary123",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    emailTextual,
    "",
    "--boundary123",
    "Content-Type: text/html; charset=UTF-8",
    "",
    emailHtml,
    "",
    "--boundary123--",
  ].join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("✅ Email sent to", option.email);
  } catch (error) {
    console.error("❌ Gmail API Error:", error);
    throw error;
  }
};

const registerEmail = (username, passwordSetUrl) => {
  return {
    body: {
      name: username,
      intro: "We got request from you to verify your account into Vercodex",
      action: {
        instructions: "To verify your account click the button below",
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
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export { sendEmail, registerEmail, forgotPasswordMailgenContent };
