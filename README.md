# Club Notifications API

Notifications API for Clubs, sort of an alternative to Remind. It can send to both phone numbers & email addresses, via Twilio and SendGrid respectively. I built this for & use it at my [Hack Club](https://hackclub.com)!

## Usage

**To send notifications easily & quickly, I recommend using the iOS Shortcuts app.** If you have it, **[here's the Shortcut I use to send notifications](https://www.icloud.com/shortcuts/414871a1b74c4efe8b09230965532461)**. Put in your API token (`APP_AUTH_TOKEN` in `.env`) and API URL (wherever you're hosting it) on the import questions and you're good to go! If you don't want to use Shortcuts, you can absolutely send an HTTP request with your method of choice.

**Testing:** set `AIRTABLE_BASE_SUFFIX` in `.env` to `DEV`, and ensure you have an Airtable base called "Students DEV". I recommend testing the Shortcut in this mode before sending any notifications!

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
