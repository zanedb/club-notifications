# Club Notifications API

Notifications API for Clubs, sort of an alternative to Remind. It takes an Airtable base, and sends a message via both SMS and email to all students, via Twilio and SendGrid respectively. I built this for & use it at my [Hack Club](https://hackclub.com)!

## Usage

**To send notifications easily & quickly, I recommend using the iOS Shortcuts app.**

If you have it, **[here's the Shortcut I use to send notifications](https://www.icloud.com/shortcuts/414871a1b74c4efe8b09230965532461)**. Put in your API token (`APP_AUTH_TOKEN` in `.env`) and API URL (wherever you're hosting it) on the import questions and you're good to go!

If you don't want to use Shortcuts, you can absolutely send an HTTP request with your method of choice.

**Testing:** set `AIRTABLE_BASE_SUFFIX` in `.env` to `DEV`, and ensure you have an Airtable base called "Students DEV". I recommend testing the Shortcut in this mode before sending any notifications!

## Documentation

All requests should supply authentication, either in the form of a Bearer token header (ex. `Authorization: Bearer 123`) or as a query parameter in the URL (ex. `/api/notifications?token=123`). Tokens are currently set with the `APP_AUTH_TOKEN` environment variable on Vercel. Here are all the requests available:

- `GET /api/notifications`

A GET request to `/api/notifications` (no body needed) will return

```
{
  "messagesToSend": 2,
  "emailsToSend": 1,
  "textsToSend": 1,
  "approxCost": 0.0075,
  "airtableBaseSuffix": ""
}
```

- `POST /api/notifications`

A POST request to `/api/notifications` with the following body

```
{
  "message": "This is the SMS that will be sent, and the body of the email if it's sent.",
  "subject": "This field is optional! If included, it will send emails as well with this subject line. If not, just SMS."
}
```

will return

```
{
  "status": 200,
  "message": "messages sent!"
}
```

## Setup

1. Make a copy of the [Airtable base template](https://airtable.com/shrMJutlP3wjdHj6y). Feel free to add fields as you wish, but keep the default ones the same.

2. Create an `.env` file, using the below template.

```
# Find these at https://airtable.com/api
AIRTABLE_BASE_ID=
AIRTABLE_API_KEY=
# Example: if set to 'DEV', will look for Airtable bases called 'Students DEV' and 'Announcements DEV' (note the space!)
# This is for development purposes, leave blank in production
AIRTABLE_BASE_SUFFIX=
# Find these at https://www.twilio.com/console/project/settings
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
# Create a messaging service at https://www.twilio.com/console/sms/services
TWILIO_MESSAGING_SERVICE_SID=
# Create one at https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=
# Create one at https://sendgrid.com/dynamic_templates
SENDGRID_TEMPLATE_ID=
# You can also put "Name <email@domain.com>" to include a from name
# Make sure to authenticate your domain with SendGrid beforehand!
SENDGRID_FROM_EMAIL=
# This is the Bearer token you will use to send an authenticated request
# Make it a long, secure string and be sure to keep it private
# Note that you can have multiple (comma-separated) tokens
APP_AUTH_TOKEN=
```

3. Install dependencies.

```
yarn
```

4. Start the server.

```
yarn start
```
