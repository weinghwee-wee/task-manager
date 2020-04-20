const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'weinghwee.wee@hotmail.com',
    subject: 'Welcome to Task Manager',
    text: `Hi ${name}, welcome to the app.`
  })
}

const sendCancelEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'weinghwee.wee@hotmail.com',
    subject: 'Goodbye to Task Manager',
    text: `Hi ${name}, Goodbye.`
  })
}


module.exports = [sendWelcomeEmail, sendCancelEmail]