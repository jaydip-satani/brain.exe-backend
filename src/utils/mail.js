import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendMail = async (option) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Taskio",
      link: "https://taskio.jaydipsatani.com/",
    },
  });

  const emailText = mailGenerator.generatePlaintext(option.mailGenContent);
  const emailBody = mailGenerator.generate(option.mailGenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_TRAP_HOST,
    port: process.env.MAIL_TRAP_PORT,
    secure: process.env.MAIL_TRAP_PORT == 465 ? true : false,
    auth: {
      user: process.env.MAIL_TRAP_USER,
      pass: process.env.MAIL_TRAP_PASSWORD,
    },
  });
  const mail = {
    from: "info@taskio.com",
    to: option.email,
    subject: option.subject,
    text: emailText,
    html: emailBody,
  };

  try {
    const data = await transporter.sendMail(mail);
    return data;
  } catch (error) {
    console.error("Email failed to send", error);
  }
};

const emailVerificationMailGenContent = (username, verificationURL) => {
  return {
    body: {
      name: username,
      intro: "Welcome to Taskio! We're very excited to have you on board.",
      action: {
        instructions: "To get started with Taskio, please click here:",
        button: {
          color: "#22BC66",
          text: "verify your email",
          link: verificationURL,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

const forgotPasswordMaiGenContent = (username, passwordURL) => {
  return {
    body: {
      name: username,
      intro: "We got a request to reset your password",
      action: {
        instructions: "To change the password  click the button:",
        button: {
          color: "#22BC66",
          text: "Reset Password",
          link: passwordURL,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export {
  emailVerificationMailGenContent,
  forgotPasswordMaiGenContent,
  sendMail,
};
