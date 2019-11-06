require('dotenv').config()

const Airtable = require('airtable')
const express = require('express')
const sgMail = require('@sendgrid/mail')
const Twilio = require('twilio')
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
  AIRTABLE_BASE_SUFFIX
} = process.env

const TWILIO_COST_PER_TEXT = 0.0075
const PORT = 4000

const app = express().use(express.json())
const airtableBase = new Airtable(AIRTABLE_API_KEY).base(AIRTABLE_BASE)
const twilio = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
sgMail.setApiKey(SENDGRID_API_KEY)

app.get('/', (req, res) => {
  res.json({
    status: 200,
    message: 'hi there!',
    url: '/mystery'
  })
})

app.get('/mystery', (req, res) => {
  res.json({
    status: 200,
    message: 'check back later ;)'
  })
})

app.use('/v1/*', (req, res, next) => {
  // only allow authenticated users to access API
  if (req.get('Authorization')) {
    // for Bearer token authorization, extract the token
    if (authenticate(req.get('Authorization').split(' ')[1])) {
      next()
    } else {
      res.status(401).json({ status: 401, error: 'permission denied' })
    }
  } else {
    res.status(401).json({ status: 401, error: 'authorization required' })
  }
})

// get estimation of notification cost & quantity
app.get('/v1/notification', (req, res) => {
  const students = []

  base('Students')
    .select({
      view: 'Grid view'
    })
    .eachPage(
      function page(records, fetchNextPage) {
        records.forEach(function(record) {
          if (record.get('Notifications') === 'Enabled') {
            const contactInfo = record.get('Contact info')
            const student = {
              firstName: record.get('First name'),
              lastName: record.get('Last name')
            }

            student.email = validator.isEmail(contactInfo) ? contactInfo : ''
            student.phone = validator.isMobilePhone(contactInfo)
              ? contactInfo
              : ''

            students.push(student)
          }
        })

        fetchNextPage()
      },
      function done(err) {
        if (err) {
          res.status(500).json({ status: 500, error: err.toString() })
        } else {
          const approxCost = getApproxCost(students)
          const textsToSend = getNumberOfTexts(students)

          return res.json({
            messagesToSend: students.length,
            emailsToSend: students.length - textsToSend,
            textsToSend,
            approxCost,
            airtableBaseSuffix: AIRTABLE_BASE_SUFFIX ? AIRTABLE_BASE_SUFFIX : ''
          })
        }
      }
    )
})

// send notifications
app.post('/v1/notification', (req, res) => {
  const subject = req.body.subject
  const message = req.body.message
  const errors = []

  // only send emails if user writes subject field
  let sendEmail = subject ? true : false

  if (message) {
    const students = []

    // TODO: extract into 'get students' function
    base('Students')
      .select({
        view: 'Grid view'
      })
      .eachPage(
        function page(records, fetchNextPage) {
          records.forEach(function(record) {
            // only send messages to students with 'Notifications' field enabled
            if (record.get('Notifications') === 'Enabled') {
              const contactInfo = record.get('Contact info')
              const student = {
                firstName: record.get('First name'),
                lastName: record.get('Last name')
              }

              student.email = validator.isEmail(contactInfo) ? contactInfo : ''
              student.phone = validator.isMobilePhone(contactInfo)
                ? contactInfo
                : ''

              students.push(student)
            }
          })

          fetchNextPage()
        },
        function done(err) {
          if (err) {
            errors.push({ status: 500, error: err.toString() })
          } else {
            Promise.all(
              students.map(student => {
                if (!validator.isEmpty(student.phone)) {
                  twilio.messages.create({
                    to: student.phone,
                    from: TWILIO_MESSAGING_SERVICE_SID,
                    body: message
                  })
                }
                if (sendEmail && !validator.isEmpty(student.email)) {
                  const msg = {
                    to: student.email,
                    from: SENDGRID_FROM_EMAIL,
                    templateId: SENDGRID_TEMPLATE_ID,
                    dynamic_template_data: { subject, message }
                  }
                  sgMail.send(msg)
                }
                return
              })
            )
              .then(() => {
                const approxCost = getApproxCost(students)
                base('Announcements').create(
                  [
                    {
                      fields: {
                        Message: message,
                        Subject: sendEmail ? subject : '',
                        'Messages sent': students.length,
                        Cost: approxCost
                      }
                    }
                  ],
                  function(err) {
                    if (err)
                      errors.push({ status: 500, message: err.toString() })
                    return
                  }
                )
                return res.json({ status: 200, message: 'messages sent!' })
              })
              .catch(err => {
                errors.push({ status: 500, message: err.toString() })
              })
          }
        }
      )
  } else {
    errors.push({
      status: 400,
      message: 'missing parameter: message'
    })
  }
  if (errors.length > 0) {
    return res.status(500).json({
      errors: errors
    })
  }
})

const authenticate = token => {
  const tokens = APP_AUTH_TOKEN.split(',')
  return tokens.includes(token)
}

const base = name =>
  airtableBase(
    `${name}${AIRTABLE_BASE_SUFFIX ? ` ${AIRTABLE_BASE_SUFFIX}` : ''}`
  )

const getApproxCost = students =>
  getNumberOfTexts(students) * TWILIO_COST_PER_TEXT

const getNumberOfTexts = students =>
  students.filter(student => !validator.isEmpty(student.phone)).length

const listener = app.listen(PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port)
})
