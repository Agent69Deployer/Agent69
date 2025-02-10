/**
 * server.js
 *
 * The main server file with the ability to power multiple AI agents.
 */

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const { TwitterApi } = require("twitter-api-v2");
const axios = require("axios");

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(
  session({
    secret: "multi-agent-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Hard-coded callback and scopes
const FIXED_CALLBACK_URL = "http://localhost:4000/twitter/callback";
const FIXED_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

/**
 * Utility: Remove square brackets, hashtags, emojis, and leading/trailing quotes.
 */
function cleanUpTweet(text) {
  let cleaned = text || "";

  // 1) Remove square brackets
  cleaned = cleaned.replace(/\[|\]/g, "");

  // 2) Remove hashtags (#word)
  cleaned = cleaned.replace(/#[^\s]+/g, "");

  // 3) Remove all emojis (\p{Extended_Pictographic})
  cleaned = cleaned.replace(/\p{Extended_Pictographic}/gu, "");

  // 4) Remove leading/trailing single or double quotes
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, "");

  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/* ------------------------------------------------------
   1. TWITTER OAUTH2: STEP 1 (GET /twitter/auth)
   ------------------------------------------------------ */
app.get("/twitter/auth", async (req, res) => {
  try {
    const { agentId, clientId, clientSecret } = req.query;
    if (!agentId || !clientId || !clientSecret) {
      return res
        .status(400)
        .send("Missing required query params: agentId, clientId, clientSecret");
    }

    // Store in session
    req.session.agentId = agentId;
    req.session.clientId = clientId;
    req.session.clientSecret = clientSecret;

    const client = new TwitterApi({
      clientId,
      clientSecret,
    });

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      FIXED_CALLBACK_URL,
      { scope: FIXED_SCOPES }
    );
    req.session.codeVerifier = codeVerifier;
    req.session.state = state;

    return res.redirect(url);
  } catch (error) {
    console.error("Error generating OAuth2 link:", error);
    res.status(500).send("Error generating OAuth2 link");
  }
});

/* ------------------------------------------------------
   2. TWITTER OAUTH2: STEP 2 (GET /twitter/callback)
   ------------------------------------------------------ */
app.get("/twitter/callback", async (req, res) => {
  const { state, code } = req.query;
  if (!req.session.state || req.session.state !== state) {
    return res.status(400).send("Stored state did not match!");
  }

  const agentId = req.session.agentId;
  const clientId = req.session.clientId;
  const clientSecret = req.session.clientSecret;
  if (!agentId || !clientId || !clientSecret) {
    return res.status(400).send("Missing agent credentials in session!");
  }

  try {
    const client = new TwitterApi({ clientId, clientSecret });
    const { client: loggedClient, accessToken, refreshToken } =
      await client.loginWithOAuth2({
        code,
        codeVerifier: req.session.codeVerifier,
        redirectUri: FIXED_CALLBACK_URL,
      });

    const { data: user } = await loggedClient.v2.me();

    // Clear session
    req.session.agentId = undefined;
    req.session.clientId = undefined;
    req.session.clientSecret = undefined;
    req.session.codeVerifier = undefined;
    req.session.state = undefined;

    // Redirect back to frontend with tokens + user info
    const redirectUrl = new URL("http://localhost:3000");
    redirectUrl.searchParams.set("agentId", agentId);
    redirectUrl.searchParams.set("accessToken", accessToken);
    redirectUrl.searchParams.set("refreshToken", refreshToken);
    redirectUrl.searchParams.set("username", user.username);
    redirectUrl.searchParams.set("id", user.id);

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Error in Twitter callback:", error);
    res.status(500).send("Twitter callback error");
  }
});

/* ------------------------------------------------------
   3. API to generate + post a tweet (POST /api/tweet)
   ------------------------------------------------------
   Expects JSON body including:
   {
     name,
     mentionAgentName,
     clientId,
     clientSecret,
     twitterAccessToken,
     twitterRefreshToken,
     chatGptKey,
     model,
     personality,
     postingStyle,
     writingStyle,
     read,         // "yes" or "no"
     hashtag       // if read = "yes"
   }
------------------------------------------------------ */
app.post("/api/tweet", async (req, res) => {
  const {
    name,
    mentionAgentName,
    clientId,
    clientSecret,
    twitterAccessToken,
    twitterRefreshToken,
    chatGptKey,
    model,
    personality,
    postingStyle,
    writingStyle,
    read,
    hashtag,
  } = req.body;

  // Basic validation
  if (
    !name ||
    !mentionAgentName ||
    !clientId ||
    !clientSecret ||
    !twitterAccessToken ||
    !twitterRefreshToken ||
    !chatGptKey ||
    !model ||
    !personality ||
    !postingStyle ||
    !writingStyle ||
    !read
  ) {
    return res
      .status(400)
      .json({ error: "Missing required fields. Make sure everything is filled out." });
  }

  if (read === "yes" && (!hashtag || !hashtag.trim().startsWith("#"))) {
    return res.status(400).json({
      error: 'If "Read" = yes, you must provide a valid single hashtag (e.g. "#Bitcoin").',
    });
  }

  let newAccessToken = twitterAccessToken;
  let newRefreshToken = twitterRefreshToken;

  // Try refreshing token once
  let refreshedClient;
  try {
    const client = new TwitterApi({ clientId, clientSecret });
    const refreshRes = await client.refreshOAuth2Token(twitterRefreshToken);
    refreshedClient = refreshRes.client;

    if (refreshRes.accessToken) {
      newAccessToken = refreshRes.accessToken;
      newRefreshToken = refreshRes.refreshToken;
    }
  } catch (err) {
    console.error("Error refreshing token:", err);
    refreshedClient = new TwitterApi(newAccessToken);
  }

  // If read="yes", fetch top 20 tweets for the hashtag
  let topTweetsText = "";
  if (read === "yes" && hashtag) {
    try {
      const searchRes = await refreshedClient.v2.search(hashtag, {
        max_results: 20,
        "tweet.fields": ["text", "created_at"],
      });
      if (searchRes.data && searchRes.data.data) {
        const tweets = searchRes.data.data.map((tw) => tw.text);
        topTweetsText = tweets.join("\n---\n");
      }
    } catch (err) {
      console.error("Error searching tweets:", err);
    }
  }

  /* ------------------------------------------------------
     4. CHAT GPT BUILD: STEP 4 (Build system prompt)
  ------------------------------------------------------ */
  let systemPrompt = `You are an AI Twitter agent.
Agent name: ${name}
Personality: ${personality}
Posting Style: ${postingStyle}
Writing Style: ${writingStyle}

If there are any topics or words to avoid, they are mentioned in the personality.
Keep the final tweet under 280 characters.
`;

  if (mentionAgentName === "yes") {
    systemPrompt += `Include the agent name ("${name}") in the tweet text when appropriate.\n`;
  } else {
    systemPrompt += `Do NOT mention the agent name in the tweet.\n`;
  }

  if (read === "yes" && topTweetsText) {
    systemPrompt += `
You have read the following tweets about ${hashtag}:
${topTweetsText}
Incorporate relevant insights from these tweets, but do NOT copy them verbatim.
Keep the final tweet under 280 characters.
`;
  }

  // Prepare the ChatGPT messages
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content:
        "Write a single tweet under 280 characters. Avoid bracketed quotes like [this], and do not start or end with a quotation mark.",
    },
  ];

  let generatedText = "";
  try {
    const openAiRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages,
        max_tokens: 80,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${chatGptKey}`,
        },
      }
    );
    generatedText = openAiRes.data.choices[0].message.content.trim();

    // If GPT output is longer than 280 chars, slice it
    if (generatedText.length > 280) {
      generatedText = generatedText.slice(0, 280);
    }

    // -------------------
    // 5. POST-PROCESSING
    // -------------------
    generatedText = cleanUpTweet(generatedText);

  } catch (error) {
    console.error("Error calling OpenAI:", error.response?.data || error.message);
    return res
      .status(500)
      .json({ error: "OpenAI API error", details: error.response?.data });
  }

  // Post to Twitter
  let postedTweetId = null;
  try {
    const tweetRes = await refreshedClient.v2.tweet(generatedText);
    postedTweetId = tweetRes.data.id;

    console.log(`Successfully posted tweet with ID: ${postedTweetId} - Text: ${generatedText}`);
  } catch (error) {
    console.error("Error posting tweet:", error);
    return res.status(500).json({
      error: "Error posting tweet",
      generatedText,
      details: error.response?.data || error.message,
    });
  }

  return res.json({
    success: true,
    generatedText,
    tweetId: postedTweetId,
    newAccessToken,
    newRefreshToken,
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
