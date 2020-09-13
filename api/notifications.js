const Airtable = require('airtable')
const sgMail = require('@sendgrid/mail')
const Twilio = require('twilio')
const { isEmpty } = require('lodash')
const validator = require('validator')

const {
  AIRTABLE_BASE,
  AIRTABLE_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  SENDGRID_API_KEY,
  TWILIO_MESSAGING_SERVICE_SID,
  SENDGRID_FROM_EMAIL,
  SENDGRID_TEMPLATE_ID,
  APP_AUTH_TOKEN,
  AIRTABLE_BASE_SUFFIX,
} = process.env

const TWILIO_COST_PER_TEXT = 0.0075

module.exports = async (req, res) => {
  // only allow authenticated users to access API
  if (isPopulated(req.headers.authorization)) {
    // extract Bearer token
    if (!authenticate(req.headers.authorization.split(' ')[1])) {
      return error(res, 401, 'permission denied')
    }
  } else {
    return error(res, 401, 'authorization required')
  }

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

/* AIRTABLE UTIL */

const getAirtableStudents = async (options) => {
  const { baseId, tableName, select } = options
  const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(baseId)(
    table(tableName)
  )
  const rawResults = await airtable.select(select).all()

  return await rawResults.reduce((students, record) => {
    if (record.fields['Notifications'] === 'Enabled') {
      const contactInfo = record.fields['Contact info']
      const student = {
        recordId: record.id,
        firstName: record.fields['First name'],
        lastName: record.fields['Last name'],
      }

      student.email = validator.isEmail(contactInfo) ? contactInfo : ''
      student.phone = validator.isMobilePhone(contactInfo) ? contactInfo : ''

      students.push(student)
    }
    return students
  }, [])
}

const createAirtableRecord = async (options) => {
  const { baseId, tableName, fields } = options

  return new Promise((resolve, reject) => {
    const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(baseId)(
      table(tableName)
    )
    airtable.create(fields, (err, records) => {
      if (err) {
        reject(err)
      }
      resolve(records)
    })
  })
}

const table = (tableName) =>
  `${tableName}${AIRTABLE_BASE_SUFFIX ? ` ${AIRTABLE_BASE_SUFFIX}` : ''}`

const getApproxCost = (students) =>
  getNumberOfTexts(students) * TWILIO_COST_PER_TEXT

const getNumberOfTexts = (students) =>
  students.filter((student) => !validator.isEmpty(student.phone)).length

/* REQUEST UTIL */

const authenticate = (token) => {
  const tokens = APP_AUTH_TOKEN.split(',')
  return tokens.includes(token)
}

const error = (res, status, message) => {
  res.status(status).json({
    status,
    message,
  })
}

/* MISC */

const isPopulated = (obj) => !isEmpty(obj)
