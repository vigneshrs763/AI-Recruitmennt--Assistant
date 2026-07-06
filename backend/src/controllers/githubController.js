import https from 'https';

export const githubLogin = (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId || clientId === 'your_github_client_id') {
    return res.status(400).json({ message: 'GitHub OAuth is not configured' });
  }

  const redirectUri = encodeURIComponent(process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/github/callback');
  const scope = 'read:user repo';
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`);
};

export const githubCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'GitHub authorization code is missing' });
  }

  const postData = JSON.stringify({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code
  });

  const options = {
    hostname: 'github.com',
    path: '/login/oauth/access_token',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', async () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          return res.status(400).json({ message: parsed.error_description || 'GitHub OAuth failed' });
        }

        const accessToken = parsed.access_token;
        return res.json({ accessToken, message: 'GitHub connected successfully' });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to parse GitHub response', error: error.message });
      }
    });
  });

  request.on('error', (error) => {
    res.status(500).json({ message: 'GitHub OAuth request failed', error: error.message });
  });

  request.write(postData);
  request.end();
};

export const githubRepos = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.githubAccessToken) {
      return res.status(400).json({ message: 'GitHub account is not connected' });
    }

    const options = {
      hostname: 'api.github.com',
      path: '/user/repos?per_page=10',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.githubAccessToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'AIRecruitmentAssistant'
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const repos = JSON.parse(data);
          return res.json({ repos });
        } catch (error) {
          return res.status(500).json({ message: 'Failed to parse GitHub repos response', error: error.message });
        }
      });
    });

    request.on('error', (error) => {
      res.status(500).json({ message: 'Failed to fetch GitHub repositories', error: error.message });
    });

    request.end();
  } catch (error) {
    res.status(500).json({ message: 'GitHub repos request failed', error: error.message });
  }
};

export const githubUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.githubAccessToken) {
      return res.status(400).json({ message: 'GitHub account is not connected' });
    }

    const options = {
      hostname: 'api.github.com',
      path: '/user',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.githubAccessToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'AIRecruitmentAssistant'
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const profile = JSON.parse(data);
          return res.json({ profile });
        } catch (error) {
          return res.status(500).json({ message: 'Failed to parse GitHub user response', error: error.message });
        }
      });
    });

    request.on('error', (error) => {
      res.status(500).json({ message: 'Failed to fetch GitHub user details', error: error.message });
    });

    request.end();
  } catch (error) {
    res.status(500).json({ message: 'GitHub user request failed', error: error.message });
  }
};
