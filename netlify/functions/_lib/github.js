class GitHubError extends Error {
    constructor(message, statusCode, details = "") {
        super(message);
        this.name = "GitHubError";
        this.statusCode = statusCode;
        this.details = details;
    }
}

function getGitHubConfig() {
    const config = {
        token: (process.env.GITHUB_TOKEN || "").trim(),
        owner: (process.env.GITHUB_OWNER || "").trim(),
        repo: (process.env.GITHUB_REPO || "").trim(),
        branch: (process.env.GITHUB_BRANCH || "").trim()
    };

    const missing = Object.entries(config)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        throw new Error(`Faltan variables de GitHub: ${missing.join(", ")}.`);
    }

    if (!/^[A-Za-z0-9_.-]+$/.test(config.owner) ||
        !/^[A-Za-z0-9_.-]+$/.test(config.repo) ||
        !/^[A-Za-z0-9._/-]+$/.test(config.branch) ||
        config.branch.includes("..") ||
        config.branch.startsWith("/") ||
        config.branch.endsWith("/")) {
        throw new Error("La configuración del repositorio GitHub no es válida.");
    }

    return config;
}

function encodeRepositoryPath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
}

async function githubRequest(path, options = {}) {
    const config = getGitHubConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let response;

    try {
        response = await fetch(`https://api.github.com${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${config.token}`,
                "Content-Type": "application/json",
                "User-Agent": "citrob-admin-panel",
                "X-GitHub-Api-Version": "2022-11-28",
                ...(options.headers || {})
            }
        });
    } catch (error) {
        if (error && error.name === "AbortError") {
            throw new GitHubError("GitHub no respondió dentro del tiempo esperado.", 504);
        }
        throw new GitHubError("No fue posible conectar con GitHub.", 502);
    } finally {
        clearTimeout(timeout);
    }

    const responseText = await response.text();
    let payload = {};

    if (responseText) {
        try {
            payload = JSON.parse(responseText);
        } catch {
            payload = { message: responseText };
        }
    }

    if (!response.ok) {
        throw new GitHubError(
            "GitHub rechazó la operación.",
            response.status,
            payload.message || ""
        );
    }

    return payload;
}

async function getRepositoryFile(filePath) {
    const config = getGitHubConfig();
    const encodedPath = encodeRepositoryPath(filePath);
    const query = new URLSearchParams({ ref: config.branch });
    const payload = await githubRequest(
        `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodedPath}?${query}`
    );

    if (payload.type !== "file" || payload.encoding !== "base64" || !payload.sha) {
        throw new GitHubError("GitHub devolvió un archivo inesperado.", 502);
    }

    return {
        sha: payload.sha,
        content: Buffer.from(String(payload.content).replace(/\s/g, ""), "base64"),
        path: payload.path
    };
}

async function putRepositoryFile(filePath, content, message, sha) {
    const config = getGitHubConfig();
    const encodedPath = encodeRepositoryPath(filePath);
    const body = {
        message,
        content: Buffer.from(content).toString("base64"),
        branch: config.branch
    };

    if (sha) body.sha = sha;

    return githubRequest(
        `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodedPath}`,
        {
            method: "PUT",
            body: JSON.stringify(body)
        }
    );
}

module.exports = {
    GitHubError,
    getGitHubConfig,
    getRepositoryFile,
    putRepositoryFile
};
