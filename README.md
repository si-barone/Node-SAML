# Node-SAML
This is a basic service provider written in Node.js. The main page is accessed via https://localhost:8443/app endpoint. 

## Login
Navigating to the /app endpoint should initiate login from the service provider, redirect you to your IDP, and redirect you back to a simple page after login that should pull the email address out of the SAML assertion.

## Logout
Clicking the logout button or navigating to the /app/logout endpoint should initiate a single logout with your IDP.