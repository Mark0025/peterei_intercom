NOTE: The current Pete Intercom App implementation does NOT use custom objects. All updates are now made directly to user attributes. This file is retained for reference only.

Setting up a Custom Object
https://app.intercom.com/a/apps/ql8el0gn/settings/data/custom-objects

Create and track custom data attributes (CDAs)
Create and track custom data that matters to your business.

Beth-Ann Sher avatar
Written by Beth-Ann Sher
Updated over 2 weeks ago
Create and track custom data attributes (CDAs) about your users and leads, based on criteria that's specific to your business. You can use this data to filter and create customer segments, and to send targeted messages and campaigns. You can also use it as qualification data to qualify leads and trial users

What's a custom data attribute?
A custom data attribute (CDA) tracks facts about your customers — like the plan someone is on, or when they signed up — as opposed to an event, which tracks recurring customer actions.

Here's an example: If your product is a project management tool, you could track data about the number of files each user has. Then, if you want to message users who haven't started adding files to the tool and might need some help onboarding, you could set up a message targeted to users with "files less than 1".

The most common CDAs set up on Intercom are about customer development, such as:

Price plan

Value of purchases

Number of teammates added

Number of songs played

Date subscription ends

Important:
The signed_up value should be sent to Intercom through your integration. This value indicates the time a user signed up for your service.

You can choose to update the value by:

sending us the created_at parameter timestamp in the intercomSettings snippet.

setting the value for signed_up_at if you're using our REST API.

using a CSV import, by mapping one of the imported columns as Signed Up date.

Intercom will automatically set the value for the signed_up date only in the following cases:

SDKs (Android/iOS) and unidentified users

users created through JS snippet with no created_at value

In those cases, users will have the signed up time set to the time of the creation request. In all other cases the value would have to be set by you.

Create custom data attributes
To create a new attribute in Intercom, go to Settings > Data > People and click + Create attribute. Give your new attribute a name, a description, select the type of data it will store.

Prevent attribute updates via the Messenger
You can choose whether the attribute can be updated via the Messenger. If the selection to "Prevent updates via the Messenger" is chosen, then any request to update this attribute from the Messenger on web, mobile or via the Javascript API will be silently ignored.

All attributes that don't have this selection checked will still be updated as normal. This setting can be toggled on or off by updating the attribute and it does not affect updates from other sources like our Public API, CSV Imports, etc.

Note:

We recommend that you disallow insecure attribute updates or creation via the Messenger, to prevent unauthorised updates to your data. You can then setup Messenger Security with JWTs to securely update those fields via the Messenger.

This setting only applies to CDAs, it cannot be enabled for standard attributes.

CDAs are only protected from insecure updates via the Messenger if the setting is turned on for each individual CDA.

Click save and the attribute will be added to your attributes list. It won't be populated for any of your customers yet, you'll need to send it to Intercom via the JavaScript snippet, the API, or an app from our app store. 👌

If you need to change the format or description of the attribute you just created, you can edit it and make the change:

The name of the custom data attribute cannot be changed after it's created. You will need to archive the existing attribute and create a new one.

Update custom attributes via the Messenger
Custom data attributes can be updated using the Messenger Javascript code snippet.

When updating custom attributes via the messenger, double check that your keys always have a JSON-valid value that is a string (text), number, or boolean (true or false). That means using double quotes around text strings and sending NULL to cater for cases when no value exists for a user.

You can also send us dates or URLs. You can track URLs as a text string, e.g. "http://www.google.com". Intercom will recognize this and automatically turn it into a hyperlink. Track dates by sending us a unix timestamp in seconds. If you create a key name that ends with "\_at" we'll automatically treat it as a date rather than a number (see "last_order_at" below). Find out how dates work in Intercom here.

Ensure that you're passing UNIX in seconds and not milliseconds.

Here are some examples of data attribute key and value pairs:

window.intercomSettings = {
email: "bob@example.com",
user_id: "123",
app_id: "abc1234",
created_at: 1234567890,
"subdomain": "intercom", // Put quotes around text strings
"teammates": 4, // Send numbers without quotes
"active_accounts": 12,
"last_order_at" : 1350466020, // Send dates in unix timestamp format and end key names with "\_at"
"custom_domain": null // Send null when no value exists for a user
}

Different types of CDAs you can send to Intercom
String (ie words) Ex. URLs, plan name, user type, etc.

Number (integer)

Boolean (true / false)

Time Stamp (the date and time something happens) e.g. "converted_at"

Things to remember:
Key names are case sensitive, and can't contain periods ('.'), dollar signs ('$'), characters like ~`!@#%^&\*'{}[]|\'" or the NULL character. — If an unsupported character is used, the attribute will be created with an underscore in its place.

Data values must be sent as JSON strings, numbers or booleans (true or false). We can't accept object, nested hashes and array data formats.

Text string values can only hold up to 255 characters.

You can clear existing data values by sending empty strings.

Intercom automatically tracks a number of standard attributes. Check these before creating custom attributes.

Soft limit is 250 active CDA's.

Once you've updated your code snippet and started tracking the data, you should:

Turn on identity verification for your users.

Create descriptions for each attribute to help your teammates understand them.
​

Important: We receive our geo-location data based on the User's IP address from a third-party service, called Maxmind. We have no control over this data and it's not possible to update it through the API, but you can choose to file a data correction request through this page if you believe it to be incorrect.

Additionally, it is possible that these users could be using a VPN, or they're traveling at the moment, which would explain why the location appears incorrect.
​
In regards to the "region" attribute: for the United States, "region" will refer to State. With other countries it may vary - for example in Canada "region" refers to Province.

You can see a list of all region values and their abbreviations here.

Other methods
It's also possible to track and update custom attributes about your users, with CSV imports, Intercom's REST API, or many third party applications.

What is custom qualification data?
Qualification data is a special set of attributes you can manually update in your customer profiles as you qualify them. You can set these up via a simple form in Intercom. If you intend to update this data manually, you don't need to do anything else.

If you want to track this data via a ping, you need to add the key/value pairs to your intercomSettings code snippet, just as you would with other custom data.

To create new custom qualification data, go to Settings > Data > People > Lead qualification.

Scroll down and click Add data then + Create new data from the dropdown menu.

Here you can create a name (that's your key) and choose a format for the values you'll collect (Text, Number, True or False, or List).

If you choose the List format, this not an array structure but rather a list of selections where values are predetermined.

It's possible to set the value of a list attribute to a value that you haven't manually configured for the list by using our REST API. This value will not get added as a permanent option for that list when manually changing the value however and may be lost if a teammate manually changes this value.

Finally, you can add a description to help your teammates understand the data.

Choose simple names for your custom qualification data. If you decide you want to qualify this data via the Messenger, customers will see these names in the Messenger.
​

Archive data attributes
Custom data attributes cannot be fully deleted, but you can archive them. Archived data won't appear as a filter in your user or lead lists, so it's a good way to clean up data you don't need.
​
Go to Settings > Data > People.
​

Choose a piece of data you'd like to archive. Click the edit icon next to it and then click Archive in the pop-up box. You can unarchive them if you change your mind, but you can't completely delete custom data attributes.

To find your archived custom attributes, just scroll to the bottom of the page.

Understanding CDA limits and best practices
Custom data attributes (CDAs) have workspace limits to maintain optimal performance.

There's a limit of 250 People and Company CDAs per workspace, but you can archive unused attributes to free up space.

When creating new attributes, consider these best practices:

Create attributes that have broad application across users.

Avoid creating attributes for one-off situations.

Consider using Events as an alternative for specific scenarios.

Utilize tags when appropriate, as they don't have the same limitations.

Regularly review your CDA usage to ensure efficient workspace management. If you need increased capacity after implementing optimization strategies, additional limit increases may be available upon request.

If you are sending data about your users via the Messenger, we strongly recommend you secure your Messenger. See more:

Authenticating your users with JSON web tokens (JWTs)
