/**
 * Minimal static file server for local development.
 *
 * The app loads its modules with <script type="module">, and ES modules are
 * CORS-checked. A file:// page is an opaque origin, so browsers refuse to load
 * them from disk — the app has to be served over HTTP. This uses only Node
 * builtins to avoid adding a dependency.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = normalize(join(fileURLToPath(import.meta.url), '..', '..'));
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8'
};

/**
 * Resolve a request path to a file inside ROOT, or null if it escapes.
 */
function resolvePath(urlPath) {
    const decoded = decodeURIComponent(urlPath.split('?')[0]);
    const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
    const resolved = normalize(join(ROOT, relative));

    if (resolved !== ROOT && !resolved.startsWith(ROOT + sep)) {
        return null;
    }
    return resolved;
}

const server = createServer(async (req, res) => {
    const filePath = resolvePath(req.url);

    if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden\n');
        return;
    }

    try {
        const body = await readFile(filePath);
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        res.end(body);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found\n');
    }
});

server.listen(PORT, () => {
    console.log(`Passage dev server running at http://localhost:${PORT}`);
});
