# ***REMOVED*** Hack Club API

Our API for [***REMOVED*** Hack Club](https://***REMOVED***/rahs). Currently used for sending notifications.

## Setup

1. Create an `.env` file, using the below template.

```
# Find these at https://airtable.com/api
AIRTABLE_BASE=
AIRTABLE_API_KEY=
# Example: if set to 'DEV', will look for Airtable bases called 'Students DEV' and 'Announcements DEV' (note the space!)
# This is for development purposes, leave blank/undefined in production
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
# Make sure to authenticate with SendGrid beforehand!
SENDGRID_FROM_EMAIL=
# Note that you can have multiple (comma-separated) tokens
APP_AUTH_TOKEN=
```

2. Install dependencies.

```
yarn
```

3. Start the server.

```
node server.js
```

