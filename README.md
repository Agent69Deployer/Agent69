# Agent69 🤖: Create & Own Your Own Agents

![Agent69 Logo](https://agent69.ai/logo.png)

**Agent69** is an open-source AI agent deployer that allows you to create and manage multiple AI agents with unique personalities and styles. The agent deployer operates locally (on your own machine), ensuring your API keys remain private and secure.

# 🤖 Agent69 Benefits 🌟

![Agent69 Interface](https://agent69.ai/interface.png)

✅ **Own Your Agent**  
All files run locally, so you keep your API keys private and secure on your own machine.

✅ **Multiple Agents**  
Create as many named agents as you want, each posting with a unique personality and style.

✅ **GPT Integration**  
Use OpenAI's ChatGPT API (3.5, 4, or 4-32k) to generate tweets with varied personalities.

✅ **Read Hashtags**  
Optionally read tweets from any hashtag for extra context. Great for trending or niche topics.

✅ **Flexible Frequency**  
Schedule tweets every X minutes or set a random interval. Let your agent surprise you!

✅ **Open Source**  
Agent69 is fully open source. Customize, extend, or modify the project however you like.

✅ **Multiple Browsers**  
Simultaneously run agents on separate Twitter accounts by opening the app in multiple browsers.

✅ **Agent Identity**  
Give self-awareness to the agent by choosing to reference its own name in tweets if you wish.

✅ **Full Control**  
Tweak personality, styling, or advanced prompt details for total creative freedom.

---

### **⚙️ Setup Instructions**

---

Follow the instructions below - even if you don't know a thing about coding. We'll make the process easy for you, guiding beginners step-by-step through the process with screenshots. 

To obtain the "Automated" label, you'll need to change it in "Settings > Your Account > Account Information > Automation". Otherwise, posts by Agent69 will appear human without the label.

> **Note:** We recommend using the agent deployer on older/verified accounts. New accounts may encounter issues with automation.

---

### **📌 Step 1: Download Node/Obtain Keys**

---

Node JS is a prerequisite, and the software won't work withoutt it. [Download Node JS](https://nodejs.org/en/download), install it on your computer, and reset. You can then proceed with the installation.

Start by obtaining keys from OpenAI API and Twitter API. Twitter API is free but for OpenAI you'll need to fund your account with at least $5 worth of tokens for a substantial amount of tweets.

---

1. **🔑 OpenAI API Key**:

Visit [OpenAI API Keys](https://platform.openai.com/account/api-keys) and obtain your API key (starts with `SK-`).
   
OpenAI is simpler, just use the default project it creates for you and get the key that starts with "SK-". You're done with OpenAI. Twitter automations setup is a bit more complicated.

---

2. **🔑 Twitter API Keys**:

---

Navigate to the [Twitter Developer Portal](https://developer.twitter.com/) and hit the link on the top-right (Developer Portal):

   ![1](https://agent69.ai/instructions/1.png)

You can choose "Sign Up For A Free Account" or sign up for one of their paid plans (recommended if your agent will do reading on twitter).

   ![1](https://agent69.ai/instructions/2.png)

You'll then need to fill out 250 words explaining why you want to use Twitter API, you can copy the text below:

   ![1](https://agent69.ai/instructions/3.png)
   
Success. You're now in the Twitter Developer Portal where you have a default project made for you. You then need to hit the little "App Settings" button inside the panel:

   ![1](https://agent69.ai/instructions/4.png)

Once you go to your app settings, focus on the bottom part where it says "User Authentication" and click on "Set Up" so you can setup your agent authentication with Twitter.

   ![1](https://agent69.ai/instructions/5.png)

Make sure to select "Read and Write" under permissions, and select "Automated App" below:

   ![1](https://agent69.ai/instructions/6.png)

Under "App Info" put "http://localhost:4000/twitter/callback" and under "Website URL" just put in "https://example.com" and it'll work. Leave the rest of the fields blank and hit save:

   ![1](https://agent69.ai/instructions/7.png)

Success! You've now obtained your "Client ID" and "Client Secret" keys that you'll use for your Agent69 agent. Copy/save these because you'll need them later:

   ![1](https://agent69.ai/instructions/8.png)

Save your **Client ID** and **Client Secret**.

---

### **📌 Step 2: Boot Agent69**

---

1. **⬇️ Download and Install**:

Once you've taken care of the most important step and obtained keys (OpenAI, Twitter client, and Twitter secret), you need to download Agent69 and describe your agent.

Download the entire Agent69 project on this page, or use the direct download link on the ![website](https://agent69.ai/), and unzip it on your computer. Here's how you can set it up:

Start up command prompt or any other command tool you use (on Windows, go to search and type "Command Prompt"). Then, put in the word "cd" followed up by the directory where Agent69 is located on your computer.

For example:

     cd C:\Users\User\Desktop\Agent69 

   ![1](https://agent69.ai/instructions/9.png)

The command prompt will now navigate to the folder where you've downloaded Agent69. Now only put "npm install" and hit enter:

   ![1](https://agent69.ai/instructions/10.png)

This will install all the required dependencies inside your Agent69 folder so it works on your computer.

---

2. **🖥️ Boot the Server**:

---

Once installation is complete, cd back to the directory the same way, and once you are inside the directory, enter the following:

     node server.js

Then press enter. This will boot up the server/back-end:

   ![1](https://agent69.ai/instructions/11.png)

You'll get a message that says:

     Server running on http://localhost:4000

Don't close this as long as your agent is running. This is also where you'll get logs like "Post successful" once the agent starts posting.

---

3. **🖥️ Boot the Front-End**:

---

Now, start a whole new command prompt and navigate to the Agent69 directory like you did last time (i.e. cd [folder where you have agent69]) using the command prompt. This time, instead of typing "node server.js", you'll type "npm start" and hit enter. This will boot up the front-end interface where you can describe your agent.

   ![1](https://agent69.ai/instructions/12.png)

You'll basically need to have two instances of the command prompt running at the same time, one for the server, and one for the front end interface. Agent69 will boot up on your default browser at the website "localhost:3000":

   ![1](https://agent69.ai/instructions/13.png)

If you don't have any agents hit the "Create New Agent" button and the rest is very easy (non-technical).

---

### **📌 Step 3: Activate Your Agent**

---

The fun part: Getting creative with our agent.

---

1. **📝 Fill Out Agent Details**:

---

Once your server and front end are running on localhost:3000, you can activate your first agent.

Start by filling out your three keys (client secret, client id, and chat gpt key) and naming your agent at the top. Note: The "Start" button won't work until you've filled out all the required input fields.

Select the Chat Gpt model (gpt 4 is recommended) and then describe the personality of your agent. We recommend using hundreds of words to give it a wide array of topics to discuss so it doesn't get repetitive.

Get creative and make it as descriptive as possible. Under "posting style" you can add further clarification. Here's how we described our 420 demo agent:

   ![1](https://agent69.ai/instructions/14.png)

- Enable "Mention Client Name" in tweets if you want the client to have an identity.

- Under "Read Tweets", leave it as "No" if you don't want the agent to process recent tweets on a subject, and select "Yes", then input the hashtags you want it to read if you want more context. Example: If your agent is a crypto trader he could technically read posts from the #Bitcoin hashtag and write a post based on the information processed. Note that you will need a paid Twitter developer plan if you plan to read through tweets because it will run out of credits very fast.

- Select a fixed frequency (i.e. every 5 minutes) or a random frequency that will randomize the posting time (one post randomly with a maximum stretch of 2 hours between posts).

You can modify the prompt sent to GPT by accessing the server.js file and changing it according to your needs.

---

2. **𝕏 Connect Twitter**:

---

Once all the fields are completed, you need to "Connect Twitter" and authorize the twitter. Here's what that looks like in our example (but you can name your app any way you want):

   ![1](https://agent69.ai/instructions/15.png)

Log into your agent account on Twitter before you attempt this step so you can easily authenticate. You'll then be redirected back to the page and it will say "Connected as: [your username]".

---

3. **📮 Start Posting**:

---

Once you're connected, press "Start" at the top. This will activate the agent and it will start posting. If you selected a 10 minute frequency, the first tweet will go out in 10 minutes.

---

**🤖🤖 Running Multiple Agents**

---

If you want to run a second agent simultaneously, you don't need to repeat the boot process. All you need to do is open "localhost:3000" in another browser, fill out the required fields, authenticate a different account and it will start posting for that agent too based on its custom parameters.

1. Open `localhost:3000` in a different browser.
2. Repeat the setup process for a new agent.
3. Authenticate a different Twitter account.

---

**FAQ**

---

**1. Is Agent69 open source? Who can use it?**

Yes! Anyone can download, modify, and use this project. It's open source with no restrictions. Enjoy total freedom to customize the code. Other agent deployers require you to sign up to a centralized server, and have oversight over your keys. You run your own agent on your machine with Agent69.

**2. Do I need coding experience to install?**  

Some basic knowledge helps, but our detailed guide walks you through every step, from downloading Node.js to generating your API keys.

**3. How do I run multiple agents simultaneously?** 

Create multiple agents in the interface. If you want each one to post under a different Twitter account, open the app in different browsers (e.g. Chrome and Firefox) so you can log into separate accounts at the same time.

**4. Can I read trending hashtags before tweeting?**

Yes, enable the "Read" option, enter your hashtag (#Bitcoin, #StockTips, etc.), and the AI will read and incorporate insights from up to 20 recent tweets.

**5. Is my data or API key shared with a 3rd party?**

No. Everything runs locally on your machine. You keep your keys private, so there's minimal risk of unauthorized access.

**6. Are GPT-4 or GPT-4-32k supported?**

Yes, as long as your OpenAI account has access to GPT-4 or GPT-4-32k. Just select it from the dropdown in the interface.

**7. Which OS is supported?**

Windows, macOS, or Linux. Anywhere you can run Node.js, you can run Agent69!

**8. Why does my Twitter not show "automated"?**

This is a custom Twitter feature you have to activate in account settings. Visit Settings > Your Account > Account Information > Automation. 

---

**License**

---

This project is licensed under the MIT License. Feel free to modify or reuse.
