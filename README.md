# GA DataLayer (ga-datalayer.js)

## CustomDataLayer

a javascript Class that define multiple datalayer push logic.

## Features

- Button Click
- Static Form Submit
- Ninjafomrs Submit
- Hubspot Form
- Hubspot Form (pop-up)


## Usage/Examples

#### Button Click

| property | required | description |
|----------|----------|-------------|
| ```btnId``` OR ```btnClass``` | ```yes``` | defines the ID or Class of ement to track  |
| ```btnEvent```| ```yes``` | defines the actual event to use for ```addEventListener```  |
| ```gaEvent```| ```yes``` | defines the value for the property ```event``` in the actual dataLayer push  ex. ```dataLayer.push({'event' : <gaEvent>})```  |

```javascript
addEventListener("DOMContentLoaded", (event) => {
  //chat click event
  CustomDataLayer.btnEvent({
    btnId: 'five9-maximize-button',
    btnEvent: 'click',
    gaEvent: 'click_chat'
  });
  //btn click event
  CustomDataLayer.btnEvent({
    btnClass: 'btn',
    btnEvent: 'click',
    gaEvent: 'click_button'
  });
});
```

#### Form Submit

| property | required | description |
|:---------|:---------|:------------|
| ```formType``` | ```yes``` | defines the form type to track. Options:  ```generic``` ```hubspot``` ```hubspot_popup``` ```ninjaforms```   |
| ```formTitle``` | ```no``` | Default: ```form_submission```. Defines the form name in the dataLayer push to. Ex: on form submission ```dataLayer.push({form_name : <formTitle>_submission})```   |
| ```formId``` | ```yes``` | Defines the ID of the form to track. IDs vary for each type of form: ```Generic : actual form element "ID" attribute``` ``` Hubspot: Hubspot form ID in the wp-admin or the "data-form-id" attribute``` ```NinjaForms: the form ID in wp-admin``` |
|```errorClass```| ```no``` | Default ```error```. Defines the input error class attribute to track. Inspect each form input error to determine which class to track. |

```javascript
addEventListener("DOMContentLoaded", (event) => {
	//console.debug('DOM Loaded');
  const generic_form = new CustomDataLayer({
    formType: 'generic',
    formTitle: 'Please provide your information below and a team member will reach out to you shortly',
    formId: 'verizon-business-account-eligibility',
  });

  const footer_form = new CustomDataLayer({
    formType: 'hubspot',
    formTitle: 'Join Our Mailing List',
    formId: 'xxxxxxx-xxxx-xxxx-xxx-xxxxxxxx'
  });

  const popup_form = new CustomDataLayer({
    formType: 'hubspot_popup',
    gaEvent: 'newsletter_signup',
    formTitle: 'Get Exclusive Deals When You Join Our Email List!',
    formId: 'xxxxxxx-xxxx-xxxx-xxx-xxxxxxxx',
    errorClass: 'input-error'
  });

  const contact_form = new CustomDataLayer({
    formType: 'ninjaforms',
    formTitle: 'Have a question or concern?',
    formId: '1',
    errorClass: 'nf-fail'
  });
});
```
## Documentation

[Hubspot Form Events](https://legacydocs.hubspot.com/global-form-events)

[Hubspot PopUp Issue](https://community.hubspot.com/t5/Lead-Capture-Tools/How-can-I-track-pop-ups-form-submissions-in-GTM-or-GA/m-p/266506)

[Ninjaforms nfFormSubmitResponse](https://chrisberkley.com/blog/ninja-forms-event-tracking-with-google-tag-manager/)