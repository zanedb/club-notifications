require('dotenv').config()

const validator = require('validator')
const express = require('express')
const Airtable = require('airtable')
const Twilio = require('twilio')
const sgMail = require('@sendgrid/mail')

const app = express()
app.use(express.json())
const airtableBase = new Airtable(process.env.AIRTABLE_API_KEY).base(
  process.env.AIRTABLE_BASE
)
const twilio = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const TWILIO_COST_PER_TEXT = 0.0075
const AIRTABLE_BASE_SUFFIX = process.env.AIRTABLE_BASE_SUFFIX
const PORT = 4000

const authenticate = token => {
  const tokens = process.env.APP_AUTH_TOKEN.split(',')
  return tokens.includes(token)
}

const base = name =>
  airtableBase(`${name} ${AIRTABLE_BASE_SUFFIX ? AIRTABLE_BASE_SUFFIX : ''}`)

const getApproxCost = students =>
  students.filter(student => !validator.isEmpty(student.phone)).length *
  TWILIO_COST_PER_TEXT

app.get('/', (req, res) => {
  res.json({
    status: 200,
    message: 'hi there fren',
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
    if (authenticate(req.get('Authorization').split(' ')[1])) {
     next() 
    } else {
      res.status(401).json({ error: 'permission denied' })
    }
  } else {
    res.status(401).json({ error: 'authorization required' })
  }
})

// get estimation of notification cost & quantity
app.get('/v1/notification', (req, res) => {
  const errors = []
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
          errors.push({ status: 500, error: err.toString() })
        } else {
          const approxCost = getApproxCost(students)
          return res.json({ messagesToSend: students.length, approxCost })
        }
      }
    )
  if (errors.length > 0) {
    return res.status(500).json({
      errors: errors
    })
  }
})

// send notifications
app.post('/v1/notification', (req, res) => {
  const subject = req.body.subject
  const message = req.body.message
  
  const errors = []

  let sendEmail = subject ? true : false

  if (!message) {
    errors.push({
      status: 400,
      message: 'missing parameter: message'
    })
  }

  if (message && subject) {
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
            errors.push({ status: 500, error: err.toString() })
          } else {
            Promise.all(
              students.map(student => {
                if (!validator.isEmpty(student.phone)) {
                  twilio.messages.create({
                    to: student.phone,
                    from: process.env.TWILIO_MESSAGING_SERVICE_SID,
                    body: message
                  })
                }
                if ((!validator.isEmpty(student.email)) && sendEmail) {
                  const msg = {
                    to: student.email,
                    from: 'team@***REMOVED***.com',
                    templateId: 'd-97bf6bcc920145e7a88262f55c3df32d',
                    dynamic_template_data: { subject, message }
                  };
                  sgMail.send(msg);
                }
                return
              })
            )
              .then(messages => {
                const approxCost = getApproxCost(students)
                base('Announcements').create(
                  [
                    {
                      fields: {
                        Message: message,
                        Subject: subject,
                        'Messages sent': students.length,
                        Cost: approxCost
                      }
                    }
                  ],
                  function(err, records) {
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
  }
  if (errors.length > 0) {
    return res.status(500).json({
      errors: errors
    })
  }
})

const listener = app.listen(PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port)
})
