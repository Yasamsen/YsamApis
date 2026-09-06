// Generic OAuth2 (authorization code flow) helpers for Google, GitHub
// and Facebook. No client secrets ever leave the server — the browser
// only ever sees a redirect to the provider and back.

const crypto = require("crypto");

const PROVIDERS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: "openid email profile",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    emailUrl: "https://api.github.com/user/emails",
    scope: "read:user user:email",
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
  },
  facebook: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email,picture",
    scope: "email public_profile",
    clientIdEnv: "FACEBOOK_CLIENT_ID",
    clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
  },
};

function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function getRedirectUri(req, provider) {
  return `${getBaseUrl(req)}/api/auth/${provider}/callback`;
}

function generateState() {
  return crypto.randomBytes(16).toString("hex");
}

function getAuthorizationUrl(provider, req, state) {
  const config = PROVIDERS[provider];
  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    throw new Error(`${config.clientIdEnv} is not configured`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req, provider),
    scope: config.scope,
    state,
    response_type: "code",
  });

  if (provider === "google") {
    params.set("access_type", "online");
    params.set("prompt", "select_account");
  }

  return `${config.authUrl}?${params.toString()}`;
}

async function exchangeCodeForToken(provider, req, code) {
  const config = PROVIDERS[provider];
  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];
  if (!clientId || !clientSecret) {
    throw new Error(`${provider} OAuth is not configured`);
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: getRedirectUri(req, provider),
    grant_type: "authorization_code",
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for token (${provider})`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(`No access token returned by ${provider}`);
  }
  return data.access_token;
}

async function fetchNormalizedProfile(provider, accessToken) {
  const config = PROVIDERS[provider];

  if (provider === "google") {
    const res = await fetch(config.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await res.json();
    return {
      providerId: profile.sub,
      name: profile.name || profile.email,
      email: profile.email || null,
      avatar: profile.picture || null,
    };
  }

  if (provider === "github") {
    const res = await fetch(config.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "SamApi" },
    });
    const profile = await res.json();

    let email = profile.email;
    if (!email) {
      const emailRes = await fetch(config.emailUrl, {
        headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "SamApi" },
      });
      const emails = await emailRes.json();
      const primary = Array.isArray(emails) ? emails.find((e) => e.primary) || emails[0] : null;
      email = primary ? primary.email : null;
    }

    return {
      providerId: String(profile.id),
      name: profile.name || profile.login,
      email: email || null,
      avatar: profile.avatar_url || null,
    };
  }

  if (provider === "facebook") {
    const res = await fetch(`${config.userInfoUrl}&access_token=${accessToken}`);
    const profile = await res.json();
    return {
      providerId: profile.id,
      name: profile.name,
      email: profile.email || null,
      avatar: profile.picture && profile.picture.data ? profile.picture.data.url : null,
    };
  }

  throw new Error("Unsupported provider");
}

module.exports = {
  PROVIDERS,
  generateState,
  getAuthorizationUrl,
  exchangeCodeForToken,
  fetchNormalizedProfile,
};
