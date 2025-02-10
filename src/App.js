/**
 * App.js
 * - Front-end interface
 * - Allows multiple agents side by side.
 * - Custom agent names.
 */

import React, { useEffect, useState, useRef } from "react";
import "./App.css";

// Helper to load/save from localStorage
function loadAgentsFromStorage() {
  try {
    const data = localStorage.getItem("agents");
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error("Error parsing agents from localStorage:", err);
    return [];
  }
}
function saveAgentsToStorage(agents) {
  localStorage.setItem("agents", JSON.stringify(agents));
}

// Helper random
function randomMinutes(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Popup({ popup, onClose, onConfirm }) {
  if (!popup) return null;

  const { type, message } = popup;

  return (
    <div className="popupOverlay">
      <div className="popupContent">
        <p>{message}</p>
        {type === "confirm" ? (
          <div className="popupButtons">
            <button onClick={onConfirm}>OK</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        ) : (
          <div className="popupButtons">
            <button onClick={onClose}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [agents, setAgents] = useState([]);
  const timeoutsRef = useRef({});
  const [popup, setPopup] = useState(null);

  // On mount, load from localStorage
  useEffect(() => {
    setAgents(loadAgentsFromStorage());
  }, []);

  // Parse callback tokens from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const agentId = params.get("agentId");
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const username = params.get("username");
    const userId = params.get("id");

    if (agentId && accessToken && refreshToken) {
      const stored = loadAgentsFromStorage().map((a) => {
        if (a.id === agentId) {
          return {
            ...a,
            twitterAccessToken: accessToken,
            twitterRefreshToken: refreshToken,
            twitterUsername: username,
            twitterUserId: userId,
          };
        }
        return a;
      });
      saveAgentsToStorage(stored);
      setAgents(stored);

      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // Reschedule any posting timeouts whenever agents change
  useEffect(() => {
    Object.values(timeoutsRef.current).forEach((t) => clearTimeout(t));
    timeoutsRef.current = {};

    agents.forEach((agent) => {
      if (isAgentActive(agent)) {
        scheduleNextPost(agent);
      }
    });

    return () => {
      Object.values(timeoutsRef.current).forEach((t) => clearTimeout(t));
    };
  }, [agents]);

  function isAgentActive(agent) {
    // Agent is active if not paused and all required fields are present
    if (agent.paused) return false;
    if (
      !agent.name ||
      !agent.clientId ||
      !agent.clientSecret ||
      !agent.twitterAccessToken ||
      !agent.twitterRefreshToken ||
      !agent.chatGptKey ||
      !agent.model ||
      !agent.personality ||
      !agent.postingStyle ||
      !agent.writingStyle ||
      !agent.read ||
      !agent.mentionAgentName
    ) {
      return false;
    }
    if (agent.read === "yes" && !agent.hashtag) {
      return false;
    }
    if (agent.frequencyMode === "fixed") {
      if (!agent.frequencyMinutes || agent.frequencyMinutes <= 0) {
        return false;
      }
    }
    return true;
  }

  function scheduleNextPost(agent) {
    let delayMinutes = 1;
    if (agent.frequencyMode === "fixed") {
      delayMinutes = agent.frequencyMinutes;
    } else {
      // random from 1 to 120
      delayMinutes = randomMinutes(1, 120);
    }
    const delayMs = delayMinutes * 60 * 1000;

    const timeoutId = setTimeout(async () => {
      await doTweet(agent.id);
      const freshAgents = loadAgentsFromStorage();
      const freshAgent = freshAgents.find((a) => a.id === agent.id);
      if (freshAgent && isAgentActive(freshAgent)) {
        scheduleNextPost(freshAgent);
      }
    }, delayMs);

    timeoutsRef.current[agent.id] = timeoutId;
  }

  // CRUD
  function createAgent() {
    const newAgent = {
      id: "agent_" + Date.now(),
      name: "",
      clientId: "",
      clientSecret: "",
      twitterAccessToken: null,
      twitterRefreshToken: null,
      twitterUsername: null,
      twitterUserId: null,
      chatGptKey: "",
      model: "gpt-4",
      personality: "",
      postingStyle: "",
      writingStyle: "normal",
      mentionAgentName: "no",
      read: "no",
      hashtag: "",
      frequencyMode: "fixed",
      frequencyMinutes: 0,
      paused: true,
    };
    const updated = [...agents, newAgent];
    setAgents(updated);
    saveAgentsToStorage(updated);
  }

  function handleDeleteAgent(agentId) {
    setPopup({
      type: "confirm",
      message: "Are you sure you want to delete this agent?",
      onConfirm: () => {
        const updated = agents.filter((a) => a.id !== agentId);
        setAgents(updated);
        saveAgentsToStorage(updated);
        setPopup(null);
      },
    });
  }

  function togglePause(agentId) {
    const updated = agents.map((a) => {
      if (a.id === agentId) {
        return { ...a, paused: !a.paused };
      }
      return a;
    });
    setAgents(updated);
    saveAgentsToStorage(updated);
  }

  function handleFieldChange(agentId, field, value) {
    if (field === "hashtag") {
      if ((value.match(/#/g) || []).length > 1) {
        setPopup({
          type: "alert",
          message: "Only one hashtag is allowed!",
        });
        return; 
      }
    }

    const updated = agents.map((a) => {
      if (a.id === agentId) {
        return { ...a, [field]: value };
      }
      return a;
    });
    setAgents(updated);
    saveAgentsToStorage(updated);
  }

  // Connect Twitter
  function connectTwitter(agent) {
    const authUrl = new URL("http://localhost:4000/twitter/auth");
    authUrl.searchParams.set("agentId", agent.id);
    authUrl.searchParams.set("clientId", agent.clientId);
    authUrl.searchParams.set("clientSecret", agent.clientSecret);
    window.location.href = authUrl.toString();
  }

  // Tweet (called on schedule)
  async function doTweet(agentId) {
    const agent = loadAgentsFromStorage().find((a) => a.id === agentId);
    if (!agent) return;

    try {
      const res = await fetch("http://localhost:4000/api/tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agent.name,
          mentionAgentName: agent.mentionAgentName,
          clientId: agent.clientId,
          clientSecret: agent.clientSecret,
          twitterAccessToken: agent.twitterAccessToken,
          twitterRefreshToken: agent.twitterRefreshToken,
          chatGptKey: agent.chatGptKey,
          model: agent.model,
          personality: agent.personality,
          postingStyle: agent.postingStyle,
          writingStyle: agent.writingStyle,
          read: agent.read,
          hashtag: agent.hashtag,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedAgents = loadAgentsFromStorage().map((a) => {
          if (a.id === agentId) {
            return {
              ...a,
              twitterAccessToken: data.newAccessToken,
              twitterRefreshToken: data.newRefreshToken,
            };
          }
          return a;
        });
        saveAgentsToStorage(updatedAgents);
        setAgents(updatedAgents);
        console.log("Tweet posted:", data.generatedText);
      } else {
        setPopup({
          type: "alert",
          message: `Tweet error: ${data.error || "Unknown error"}`,
        });
      }
    } catch (err) {
      console.error("Tweet error:", err);
      setPopup({
        type: "alert",
        message: `Tweet error: ${err.message}`,
      });
    }
  }

  // Checking if agent can be started (valid fields)
  function canStart(agent) {
    if (
      !agent.name ||
      !agent.clientId ||
      !agent.clientSecret ||
      !agent.twitterAccessToken ||
      !agent.twitterRefreshToken ||
      !agent.chatGptKey ||
      !agent.model ||
      !agent.personality ||
      !agent.postingStyle ||
      !agent.writingStyle ||
      !agent.read ||
      !agent.mentionAgentName
    ) {
      return false;
    }
    if (agent.read === "yes" && !agent.hashtag) {
      return false;
    }
    if (agent.frequencyMode === "fixed") {
      if (!agent.frequencyMinutes || agent.frequencyMinutes <= 0) {
        return false;
      }
    }
    return true;
  }

  return (
    <div className="App">
      {/* Header */}
      <div className="headerArea">
        <img src="logo.png" alt="Agent69 Logo" className="logo" />
        <h1>Agent69</h1>
      </div>

      <p className="subtitle">
        Manage multiple AI Twitter agents. "Start" to begin auto-posting, "Pause" to halt.
      </p>

      <p className="subtitle">
      <strong>Note:</strong> We recommend using only with older, verified Twitter
      accounts to avoid potential issues.      
      </p>

      {/* No agents yet? */}
      {agents.length === 0 && (
        <div className="noAgentsBox">
          <p>No agents yet. Create your first agent below:</p>
          <button onClick={createAgent}>Create Agent</button>
        </div>
      )}

      {/* Agent list */}
      {agents.length > 0 && (
        <div className="agentList">
          {agents.map((agent) => {
            const isActive = isAgentActive(agent);
            const canBeStarted = canStart(agent);
            const buttonLabel = agent.paused ? "Start" : "Pause";

            return (
              <div className="agentCard" key={agent.id}>
                <div className="cardHeader">
                  <input
                    className="agentNameInput"
                    type="text"
                    placeholder="Name your agent"
                    value={agent.name}
                    onChange={(e) =>
                      handleFieldChange(agent.id, "name", e.target.value)
                    }
                  />
                  <div className="agentActions">
                    <button
                      disabled={!agent.paused && !isActive ? true : !canBeStarted}
                      onClick={() => togglePause(agent.id)}
                    >
                      {buttonLabel}
                    </button>
                    <button onClick={() => handleDeleteAgent(agent.id)}>Delete</button>
                  </div>
                </div>

                <div className="agentFields">
                  <label>
                    Twitter Client ID{" "}
                    <span
                      className="infoIcon"
                      title="Your Twitter Dev Portal Client ID. 
                      https://developer.twitter.com/"
                    >
                      ⓘ
                    </span>
                  </label>
                  <input
                    type="text"
                    value={agent.clientId}
                    onChange={(e) =>
                      handleFieldChange(agent.id, "clientId", e.target.value)
                    }
                  />

                  <label>
                    Twitter Client Secret{" "}
                    <span
                      className="infoIcon"
                      title="Your Twitter Dev Portal Client Secret. Keep this safe."
                    >
                      ⓘ
                    </span>
                  </label>
                  <input
                    type="text"
                    value={agent.clientSecret}
                    onChange={(e) =>
                      handleFieldChange(agent.id, "clientSecret", e.target.value)
                    }
                  />

                  <label>
                    ChatGPT Key{" "}
                    <span
                      className="infoIcon"
                      title="Your OpenAI API key. https://platform.openai.com/account/api-keys"
                    >
                      ⓘ
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="sk-..."
                    value={agent.chatGptKey}
                    onChange={(e) =>
                      handleFieldChange(agent.id, "chatGptKey", e.target.value)
                    }
                  />

                  <hr />

                  <label>
                    ChatGPT Model{" "}
                    <span
                      className="infoIcon"
                      title="Choose which ChatGPT model to use."
                    >
                      ⓘ
                    </span>
                  </label>
                  <select
                    value={agent.model}
                    onChange={(e) => handleFieldChange(agent.id, "model", e.target.value)}
                  >
                    <option value="gpt-4">gpt-4</option>
                    <option value="gpt-4-mini">gpt-4-mini</option>
                    <option value="gpt-5">gpt-5</option>
                    <option value="gpt-5-mini">gpt-5-mini</option>
                  </select>

                  <label>
                    Personality & (Optional) Unwanted Words{" "}
                    <span
                      className="infoIcon"
                      title="Describe your agent's personality, tone, or any topics you want to avoid."
                    >
                      ⓘ
                    </span>
                  </label>
                  <textarea
                    value={agent.personality}
                    onChange={(e) =>
                      handleFieldChange(agent.id, "personality", e.target.value)
                    }
                  />

                  <label>
                    Posting Style{" "}
                    <span
                      className="infoIcon"
                      title="Explain the style of tweets (funny, formal, marketing, etc.)."
                    >
                      ⓘ
                    </span>
                  </label>
                  <textarea
                    value={agent.postingStyle}
                    onChange={(e) =>
                      handleFieldChange(agent.id, "postingStyle", e.target.value)
                    }
                  />

                  <label>
                    Writing Style{" "}
                    <span
                      className="infoIcon"
                      title="Choose the writing style: normal, all caps, etc."
                    >
                      ⓘ
                    </span>
                  </label>
                  <select
                    value={agent.writingStyle}
                    onChange={(e) =>
                      handleFieldChange(agent.id, "writingStyle", e.target.value)
                    }
                  >
                    <option value="normal">Normal</option>
                    <option value="all lowercase">all lowercase</option>
                    <option value="ALL UPPERCASE">ALL UPPERCASE</option>
                  </select>

                  <label>
                    Mention Agent Name in Tweets?{" "}
                    <span
                      className="infoIcon"
                      title='If "yes", the agent will incorporate its name (above) into tweets.'
                    >
                      ⓘ
                    </span>
                  </label>
                  <select
                    value={agent.mentionAgentName}
                    onChange={(e) =>
                      handleFieldChange(agent.id, "mentionAgentName", e.target.value)
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>

                  <label>
                    Read Tweets?{" "}
                    <span
                      className="infoIcon"
                      title="If yes, the AI will read up to 20 tweets from a hashtag. This can cost more OpenAI tokens."
                    >
                      ⓘ
                    </span>
                  </label>
                  <select
                    value={agent.read}
                    onChange={(e) => handleFieldChange(agent.id, "read", e.target.value)}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>

                  {agent.read === "yes" && (
                    <>
                      <p className="warningText">
                        Warning: Reading tweets may increase API costs. Only one hashtag
                        is allowed.
                      </p>
                      <label>Hashtag (e.g. #Bitcoin)</label>
                      <input
                        type="text"
                        value={agent.hashtag}
                        onChange={(e) =>
                          handleFieldChange(agent.id, "hashtag", e.target.value)
                        }
                      />
                    </>
                  )}

                  <label>Frequency Mode</label>
                  <select
                    value={agent.frequencyMode}
                    onChange={(e) =>
                      handleFieldChange(agent.id, "frequencyMode", e.target.value)
                    }
                  >
                    <option value="fixed">Fixed</option>
                    <option value="random">Random</option>
                  </select>

                  {agent.frequencyMode === "fixed" && (
                    <>
                      <label>Frequency (minutes)</label>
                      <input
                        type="number"
                        value={agent.frequencyMinutes}
                        onChange={(e) =>
                          handleFieldChange(
                            agent.id,
                            "frequencyMinutes",
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </>
                  )}

                  {!agent.twitterAccessToken ? (
                    <div className="twitterConnect">
                      <p>No Twitter account connected.</p>
                      <button onClick={() => connectTwitter(agent)}>
                        Connect Twitter
                      </button>
                    </div>
                  ) : (
                    <div className="connectedBox">
                      <p>Connected as: @{agent.twitterUsername || "unknown"}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {agents.length > 0 && (
        <div className="createAgentArea">
          <button onClick={createAgent}>+ Add Another Agent</button>
        </div>
      )}

      {/* FAQ Section */}
      <div className="faqSection">
        <h2>FAQ</h2>
        <div className="faqItem">
          <h3>How do I get Twitter API keys?</h3>
          <p>
            Sign up or log in to the{" "}
            <a href="https://developer.twitter.com/" target="_blank" rel="noreferrer">
              Twitter Developer Portal
            </a>
            . Create a new project/app to obtain your Client ID and Client Secret.
          </p>
        </div>
        <div className="faqItem">
          <h3>How do I get my OpenAI (ChatGPT) API key?</h3>
          <p>
            Log in to{" "}
            <a
              href="https://platform.openai.com/account/api-keys"
              target="_blank"
              rel="noreferrer"
            >
              OpenAI
            </a>{" "}
            and generate a new API key under your account.
          </p>
        </div>
        <div className="faqItem">
          <h3>Can I run multiple agents at once?</h3>
          <p>
            Yes, but each agent must be connected to a different Twitter account. The only
            way to run two agents simultaneously is to open this app in two different
            browsers (e.g. Chrome and Firefox), each logged into a different Twitter
            account.
          </p>
        </div>

        <div className="faqItem">
          <h3>How do I get the “Automated” label on my tweets?</h3>
          <p>
            You can enable this in your Twitter account settings:{" "}
            <strong>Settings &gt; Your account &gt; Account information</strong>, if
            available. Be sure to mark your account as “automated” to display the
            automated label under your tweets.
          </p>
        </div>
      </div>

      {/* Popup for alerts/confirms */}
      <Popup
        popup={popup}
        onClose={() => setPopup(null)}
        onConfirm={popup?.onConfirm}
      />
    </div>
  );
}
