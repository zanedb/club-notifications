const sgMail = require('@sendgrid/mail')
const Twilio = require('twilio')
const validator = require('validator')

const { authorization } = require('../utils/authorization')
const {
  getAirtableStudents,
  createAirtableRecord,
} = require('../utils/airtable.js')
const {
  isEmpty,
  isPopulated,
  getApproxCost,
  getNumberOfTexts,
  error,
} = require('../utils/helpers.js')

const {
  AIRTABLE_BASE,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  SENDGRID_API_KEY,
  TWILIO_MESSAGING_SERVICE_SID,
  SENDGRID_FROM_EMAIL,
  SENDGRID_TEMPLATE_ID,
  AIRTABLE_BASE_SUFFIX,
} = process.env

const notifications = async (req, res) => {
  // GET /api/notifications
  if (req.method === 'GET') {
    const students = await getAirtableStudents({
      baseId: AIRTABLE_BASE,
      tableName: 'Students',
    })

    const approxCost = getApproxCost(students)
    const textsToSend = getNumberOfTexts(students)

    return res.json({
      messagesToSend: students.length,
      emailsToSend: students.length - textsToSend,
      textsToSend,
      approxCost,
      airtableBaseSuffix: AIRTABLE_BASE_SUFFIX ? AIRTABLE_BASE_SUFFIX : '',
    })
    // POST /api/notifications
  } else if (req.method === 'POST') {
    if (isEmpty(req.body)) return error(res, 400, 'missing req body')
    if (isEmpty(req.body.message))
      return error(res, 400, 'missing parameter: message')

    const { message, subject } = req.body

    // only send emails if subject field is populated
    const sendEmail = isPopulated(subject)
    if (sendEmail) sgMail.setApiKey(SENDGRID_API_KEY)

    const twilio = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    const students = await getAirtableStudents({
      baseId: AIRTABLE_BASE,
      tableName: 'Students',
    })

    await students.forEach(async (student) => {
      if (!validator.isEmpty(student.phone)) {
        twilio.messages.create({
          to: student.phone,
          from: TWILIO_MESSAGING_SERVICE_SID,
          body: message,
        })
      }
      if (sendEmail && !validator.isEmpty(student.email)) {
        const msg = {
          to: student.email,
          from: SENDGRID_FROM_EMAIL,
          templateId: SENDGRID_TEMPLATE_ID,
          dynamicTemplateData: { subject, message },
        }
        await sgMail.send(msg)
      }
    })

    const approxCost = getApproxCost(students)
    const record = await createAirtableRecord({
      baseId: AIRTABLE_BASE,
      tableName: 'Announcements',
      fields: {
        Message: message,
        Subject: sendEmail ? subject : '',
        // if emails aren't sent, don't include students w emails in total
        'Messages sent': sendEmail
          ? students.length
          : students.length -
            students.filter((student) => isPopulated(student.email)).length,
        Cost: approxCost,
      },
    })

    return res.json({ status: 200, message: 'messages sent!' })
  }
}

module.exports = authorization(notifications)
