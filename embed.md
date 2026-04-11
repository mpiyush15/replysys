JS SDK async

<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId            : '2094709584392829',
      autoLogAppEvents : true,
      xfbml            : true,
      version          : 'v25.0'
    });
  };

  // Load the JavaScript SDK asynchronously
  (function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
</script>

----------------------------
script tag

<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId            : '2094709584392829',
      autoLogAppEvents : true,
      xfbml            : true,
      version          : 'v25.0'
    });
  };
</script>
<script async defer crossorigin="anonymous"
  src="https://connect.facebook.net/en_US/sdk.js">
</script>
----------------------------

Webhook callback url

https://whatsapp-platform-production-e48b.up.railway.app/api/webhooks/whatsapp

----------------------------

Session info setup

window.addEventListener('message', (event) => {
  if (event.origin !== "https://www.facebook.com") return;
  try {
    const data = JSON.parse(event.data);
    if (data.type === 'WA_EMBEDDED_SIGNUP') {
      ...
    }
  } catch {
    ...
  }
});

---------------------------------
Embeded signup code setup

Load the JS SDK using the code given in JavaScript SDK section.
Follow the previous step to set up the MessageEvent listener for receiving the session info. This listener will be executed when the user completes the flow. You should store the WhatsApp business account and phone IDs locally to start the integration.
window.addEventListener('message', (event) => {/* store the data from this event in local state */});
Set up a callback function to be called when the user completes the flow using Facebook for Business Login. You will receive a code from Embedded Signup that you will need to exchange for a token. When sending this code to your backend, pass the WABA and Phone IDs along to start the integration.
const fbLoginCallback = (response) => {
  if (response.authResponse) {
    const code = response.authResponse.code;
    // The returned code must be transmitted to your backend first and then
    // perform a server-to-server call from there to our servers for an access token.
  }
}
Set up a method to be called on user click to open the Embedded Signup flow. Change your selection in the next step to get the exact code to use.
const launchWhatsAppSignup = () => {
  // Launch Facebook login
  FB.login(fbLoginCallback, {
    config_id: '1239299391737840', // configuration ID goes here
    response_type: 'code', // must be set to 'code' for System User access token
    override_default_response_type: true, // when true, any response types passed in the "response_type" will take precedence over the default types
    extras: {"version":"v4"}
  });
}
Add a button to your page to open the Embedded Signup flow.
<button onclick="launchWhatsAppSignup()" style="background-color: #1877f2; border: 0; border-radius: 4px; color: #fff; cursor: pointer; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; height: 40px; padding: 0 24px;">Login with Facebook</button>
Once the flow is complete, your callback function will send the code and IDs to your backend to continue integration. Follow the API sequences below to set up the WhatsApp Business Cloud API. Once the setup is complete, redirect your users to the final page to continue further based on your product experience.


--------------------------------------------------

Meat histed embeded sgnup landing page
https://business.facebook.com/messaging/whatsapp/onboard/?app_id=2094709584392829&config_id=1239299391737840&extras=%7B%22sessionInfoVersion%22%3A%223%22%2C%22version%22%3A%22v4%22%7D

-----------------------------------

Session loggin respnse 

[
  {
    "data": {
      "current_step": "PHONE_NUMBER_SETUP"
    },
    "type": "WA_EMBEDDED_SIGNUP",
    "event": "CANCEL"
  }
]


-------------------------------

Exchange token
const url = "https://graph.facebook.com/v25.0/oauth/access_token";
const response = await fetch(url, {
  method: "POST",
  body: JSON.stringify({
    "client_id": "2094709584392829",
    "client_secret": "********************************",
    "grant_type": "authorization_code",
    "redirect_uri": "https://developers.facebook.com/es/oauth/callback/?business_id=631302064701398&nonce=OEC34FekGbmw8YmmavDfTWqJ52naO7nc"
  }),
  headers: {"Content-Type": "application/json"},
});
const data = await response.json();
console.log(data);
--------------------------------------------------