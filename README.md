# Club Notifications API [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fzanedb%2Fclub-notifications)

### What is this?

This is a [Vercel serverless API](https://vercel.com/docs/serverless-functions/introduction) that, by HTTP request, will text and (optionally) email your message to every record in an Airtable base, similar to [Remind](https://www.remind.com)'s notification system. I built this for & use it at my [Hack Club](https://hackclub.com)!

### How does it work?

It uses the [Airtable API](https://airtable.com/api) to fetch all records, processes them, and then uses the [Twilio API](https://www.twilio.com/docs/sms) to send SMS messages and the [SendGrid API](https://sendgrid.com/solutions/email-api/) to email.

## Usage

**To send notifications easily & quickly, I recommend using the iOS Shortcuts app.**

If you have it, **[here's the Shortcut I use to send notifications](https://www.icloud.com/shortcuts/9063f2d7bb9b49148fd1c116144c9aa7)**. Put in your API token (`APP_AUTH_TOKEN` in `.env`) and API URL (wherever you're hosting it) on the import questions and you're good to go!

**If you don't want to use Shortcuts**, you can absolutely send an HTTP request with your method of choice.

**Testing:** set `AIRTABLE_BASE_SUFFIX` in `.env` to `DEV`, and ensure you have an Airtable base called "Students DEV". I recommend testing the Shortcut in this mode before sending any notifications!

## Documentation

All requests should supply authentication, either in the form of a Bearer token header (ex. `Authorization: Bearer 123`) or as a query parameter in the URL (ex. `/api/notifications?token=123`). Tokens are currently set with the `APP_AUTH_TOKEN` environment variable on Vercel. Here are all the requests available:

- `GET /api/notifications`

A GET request to `/api/notifications` (no body needed) will return

```json
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

```json
{
  "message": "This is the SMS that will be sent, and the body of the email if it's sent.",
  "subject": "This field is optional! If included, it will send emails as well with this subject line. If not, just SMS."
}
```

will return

```json
{
  "status": 200,
  "message": "messages sent!"
}
```

## Deployment

1. Make a copy of the [Airtable base template](https://airtable.com/shrMJutlP3wjdHj6y). Feel free to add fields as you wish, but keep the default ones the same.

2. One-click deploy: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fzanedb%2Fclub-notifications)

3. Set the Vercel environment variables, using the following `.env` file as a guide:

```sh
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
# This is the token you will use to send an authenticated request (see Documentation)
# Make it a long, secure string and be sure to keep it private
# Note that you can have multiple (comma-separated) tokens
APP_AUTH_TOKEN=
```

- To develop locally:

```sh
git clone https://github.com/zanedb/club-notifications
cd club-notifications
vercel dev
```
