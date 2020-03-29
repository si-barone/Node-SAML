# Node-SAML
This is a basic service provider written in Node.js. The main page is accessed via https://localhost:8443/app.

## Metadata
The metadata URL can be accessed at https://localhost:8443/metadata. This should help expedite the process of configuring your app with your IDP.

## Security
The security folder has 3 certificates which have been blanked out. The private.key and public.crt certificates should be generated in PEM format and represent bot the signing certificates and certificates for the webpage. The idp.crt is copied from your Identity Provider. It is also in PEM format.

## Login
Navigating to the /app endpoint should initiate login from the service provider, redirect you to your IDP, and redirect you back to a simple page after login that should pull the email address out of the SAML assertion.

## Logout
Clicking the logout button or navigating to the /app/logout endpoint should initiate a single logout with your IDP.